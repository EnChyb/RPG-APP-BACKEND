import express from "express";
import Talent from "../models/Talent.js";
import Weapon from "../models/Weapon.js";
import Armor from "../models/Armor.js";
import Gear from "../models/Gear.js";

const router = express.Router();

router.get("/talents", async (_req, res) => {
  try {
    const talents = await Talent.find();
    res.json(talents);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch talents", error: err });
  }
});

router.get("/weapons", async (_req, res) => {
  try {
    const weapons = await Weapon.find();
    res.json(weapons);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch weapons", error: err });
  }
});

router.get("/armor", async (_req, res) => {
  try {
    const armor = await Armor.find();
    res.json(armor);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch armor", error: err });
  }
});

router.get("/gear", async (_req, res) => {
  try {
    const gears = await Gear.find();
    res.json(gears);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch gear", error: err });
  }
});

export default router;
