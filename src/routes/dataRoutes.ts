import express from "express";
import Talent from "../models/Talent.js";
import Weapon from "../models/Weapon.js";
import Armor from "../models/Armor.js";
import Gear from "../models/Gear.js";
import Race from "../models/Race.js"
import Archetype from "../models/Archetype.js";
import Species from "../models/Species.js";
import DiscardedItem from "../models/DiscardedItem.js";

const dataRouter = express.Router();

dataRouter.get("/races", async (_req, res) => {
  try {
    const races = await Race.find();
    res.json(races);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch races", error: err });
  }
});

dataRouter.get("/archetypes", async (_req, res) => {
  try {
    const archetypes = await Archetype.find();
    res.json(archetypes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch races", error: err });
  }
});

dataRouter.get("/talents", async (_req, res) => {
  try {
    const talents = await Talent.find();
    res.json(talents);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch talents", error: err });
  }
});

dataRouter.get("/weapons", async (_req, res) => {
  try {
    const weapons = await Weapon.find();
    res.json(weapons);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch weapons", error: err });
  }
});

dataRouter.get("/armor", async (_req, res) => {
  try {
    const armor = await Armor.find();
    res.json(armor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch armor", error: err });
  }
});

dataRouter.get("/gear", async (_req, res) => {
  try {
    const gears = await Gear.find();
    res.json(gears);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gear", error: err });
  }
});

dataRouter.get("/species", async (_req, res) => {
  try {
    const species = await Species.find();
    res.json(species);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gear", error: err });
  }
});

dataRouter.post("/discard", async (req, res) => {
  try {
    const { type, item, fromCharacterId } = req.body;

    const discarded = new DiscardedItem({
      type,
      item,
      fromCharacterId,
    });

    await discarded.save();
    res.status(201).json(discarded);
  } catch (error) {
    res.status(500).json({ error: "Failed to discard item" });
  }
});

dataRouter.get("/discarded", async (req, res) => {
  try {
    const discarded = await DiscardedItem.find().sort({ createdAt: -1 });
    res.json(discarded);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch discarded items" });
  }
});

dataRouter.post(
  "/pickup/:id",
  async (req, res) => {
    try {
      const { id } = req.params;
      const item = await DiscardedItem.findByIdAndDelete(id);

      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.status(200).json({ item });
    } catch (error) {
      res.status(500).json({ error: "Failed to pick up item" });
    }
  }
);

export default dataRouter;
