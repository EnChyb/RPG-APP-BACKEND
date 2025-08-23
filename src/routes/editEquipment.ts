// routes/editEquipment.ts
import express, { Request, Response } from "express";
import Character from "../models/Character.js";
import DiscardedItem from "../models/DiscardedItem.js";
import Weapon, { IWeapon } from "../models/Weapon.js";
import Armor, { IArmor } from "../models/Armor.js";
import Gear, { IGear } from "../models/Gear.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router({ mergeParams: true });

type EquipmentCategory = "weapons" | "armor" | "gears";
type SourceLocation = "items" | "chest";
type EquipmentItem = IWeapon | IArmor | IGear;

// PATCH: Move equipped item to chest
router.patch("/character/:id/move-to-chest", protect, async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log("Character ID:", req.params.id);
  
  const { type, index } = req.body as { type: EquipmentCategory; index: number };


  try {
    const character = await Character.findById(id);
    if (!character) return res.status(404).json({ message: "Character not found" });

    const item = character.items[type][index];
    if (!item) return res.status(400).json({ message: "Item not found at given index" });

    character.items[type].splice(index, 1);

    if (type === "weapons") character.chest.weapons.push(item as IWeapon);
    else if (type === "armor") character.chest.armor.push(item as IArmor);
    else if (type === "gears") character.chest.gears.push(item as IGear);

    await character.save();
    res.status(200).json({ message: "Moved to chest", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to move item to chest" });
  }
});

// PATCH: Equip from chest to active items
router.patch("/character/:id/equip-from-chest", protect, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, index } = req.body as { type: EquipmentCategory; index: number };

  try {
    const character = await Character.findById(id);
    if (!character) return res.status(404).json({ message: "Character not found" });

    const item = character.chest[type][index];
    if (!item) return res.status(400).json({ message: "Item not found in chest" });

    character.chest[type].splice(index, 1);

    if (type === "weapons") character.items.weapons.push(item as IWeapon);
    else if (type === "armor") character.items.armor.push(item as IArmor);
    else if (type === "gears") character.items.gears.push(item as IGear);

    await character.save();
    res.status(200).json({ message: "Equipped from chest", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to equip item from chest" });
  }
});

// PATCH: Discard from inventory (items or chest)
router.patch("/character/:id/discard-from-inventory", protect, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { source, type, index } = req.body as {
    source: SourceLocation;
    type: EquipmentCategory;
    index: number;
  };

  try {
    const character = await Character.findById(id);
    if (!character) return res.status(404).json({ message: "Character not found" });

    const item = character[source][type][index];
    if (!item) return res.status(400).json({ message: "Item not found" });

    character[source][type].splice(index, 1);
    const discarded = new DiscardedItem({ type, item, fromCharacterId: id });

    await discarded.save();
    await character.save();

    res.status(200).json({ message: "Item discarded", discarded });
  } catch (err) {
    res.status(500).json({ error: "Failed to discard item" });
  }
});

// POST: Buy item from shop
router.post("/character/:id/buy", protect, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { type, itemId } = req.body as { type: EquipmentCategory; itemId: string };

  console.log("BUY: Character ID from params:", id);

  try {
    const character = await Character.findById(id);
    if (!character) return res.status(404).json({ message: "Character not found" });

    let item: EquipmentItem | null = null;

    switch (type) {
      case "weapons":
        item = await Weapon.findById(itemId);
        break;
      case "armor":
        item = await Armor.findById(itemId);
        break;
      case "gears":
        item = await Gear.findById(itemId);
        break;
      default:
        return res.status(400).json({ message: "Invalid equipment type" });
    }

    if (!item || item.price == null) {
      return res.status(400).json({ message: "Item not found or missing price" });
    }

    // Check if character has enough gold (including exact match)
    if (character.gold < item.price) {
      return res.status(400).json({ message: "Not enough gold" });
    }

    // Deduct gold and store in chest
    character.gold -= item.price;

    switch (type) {
      case "weapons":
        character.chest.weapons.push(item.toObject() as IWeapon);
        break;
      case "armor":
        character.chest.armor.push(item.toObject() as IArmor);
        break;
      case "gears":
        character.chest.gears.push(item.toObject() as IGear);
        break;
    }

    await character.save();
    res.status(200).json({ message: "Item bought and stored in chest", item });
  } catch (err) {
    res.status(500).json({ error: "Failed to buy item" });
  }
});

export default router;