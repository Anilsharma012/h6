import type { RequestHandler } from "express";
import { getDatabase } from "../db/mongodb";
import { ObjectId } from "mongodb";
import { authenticateToken, requireAdmin } from "../middleware/auth";

export interface MapLocation {
  _id?: string;
  name: string;
  city?: string;
  address?: string;
  lat: number;
  lng: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory list of SSE clients
const sseClients: Set<any> = new Set();

function broadcast(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch (e) {
      try {
        sseClients.delete(res);
      } catch {}
    }
  }
}

export const streamLocations: RequestHandler = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Send a hello ping
  res.write(`event: ping\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);

  sseClients.add(res);
  req.on("close", () => {
    sseClients.delete(res);
  });
};

export const listLocations: RequestHandler = async (_req, res) => {
  try {
    const db = getDatabase();
    const list = await db
      .collection("map_locations")
      .find({})
      .sort({ updatedAt: -1 })
      .toArray();

    res.json({ success: true, data: list });
  } catch (e: any) {
    res
      .status(500)
      .json({ success: false, error: e.message || "Failed to load locations" });
  }
};

export const createLocation: RequestHandler[] = [
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const db = getDatabase();
      const body = req.body || {};
      const doc: Omit<MapLocation, "_id"> = {
        name: String(body.name || "").trim(),
        city: body.city ? String(body.city) : undefined,
        address: body.address ? String(body.address) : undefined,
        lat: Number(body.lat),
        lng: Number(body.lng),
        active: body.active !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (!doc.name || isNaN(doc.lat) || isNaN(doc.lng)) {
        return res
          .status(400)
          .json({ success: false, error: "name, lat, lng are required" });
      }

      const result = await db.collection("map_locations").insertOne(doc);
      const created = await db
        .collection("map_locations")
        .findOne({ _id: result.insertedId });

      broadcast("locations:update", { type: "create", location: created });
      res.json({ success: true, data: created });
    } catch (e: any) {
      res
        .status(500)
        .json({
          success: false,
          error: e.message || "Failed to create location",
        });
    }
  },
];

export const updateLocation: RequestHandler[] = [
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const db = getDatabase();
      const { id } = req.params as any;
      const body = req.body || {};

      const update: any = {
        updatedAt: new Date(),
      };
      if (body.name !== undefined) update.name = String(body.name);
      if (body.city !== undefined) update.city = String(body.city);
      if (body.address !== undefined) update.address = String(body.address);
      if (body.lat !== undefined) update.lat = Number(body.lat);
      if (body.lng !== undefined) update.lng = Number(body.lng);
      if (body.active !== undefined) update.active = !!body.active;

      await db
        .collection("map_locations")
        .updateOne({ _id: new ObjectId(id) }, { $set: update });

      const updated = await db
        .collection("map_locations")
        .findOne({ _id: new ObjectId(id) });

      broadcast("locations:update", { type: "update", location: updated });
      res.json({ success: true, data: updated });
    } catch (e: any) {
      res
        .status(500)
        .json({
          success: false,
          error: e.message || "Failed to update location",
        });
    }
  },
];

export const deleteLocation: RequestHandler[] = [
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const db = getDatabase();
      const { id } = req.params as any;
      const existing = await db
        .collection("map_locations")
        .findOne({ _id: new ObjectId(id) });
      const result = await db
        .collection("map_locations")
        .deleteOne({ _id: new ObjectId(id) });
      if (!result.deletedCount) {
        return res.status(404).json({ success: false, error: "Not found" });
      }
      broadcast("locations:update", { type: "delete", location: existing, id });
      res.json({ success: true, data: { id } });
    } catch (e: any) {
      res
        .status(500)
        .json({
          success: false,
          error: e.message || "Failed to delete location",
        });
    }
  },
];
