import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { MapPin, Plus, Trash2, Save } from "lucide-react";

interface MapLocation {
  _id?: string;
  name: string;
  city?: string;
  address?: string;
  lat: number;
  lng: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function MapLocationsManagement() {
  const { token } = useAuth();
  const [locations, setLocations] = useState<MapLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<MapLocation>>({ active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLocations();

    // Subscribe to realtime updates (SSE)
    const es = new EventSource("/api/map-locations/stream");
    es.addEventListener("locations:update", (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data);
        if (payload?.location) {
          setLocations((prev) => {
            const map = new Map(prev.map((l) => [l._id, l] as const));
            if (payload.type === "delete") {
              map.delete(payload.location?._id || payload.id);
            } else {
              map.set(payload.location._id, payload.location);
            }
            return Array.from(map.values()).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
          });
        }
      } catch {}
    });
    es.onerror = () => {
      try { es.close(); } catch {}
    };
    return () => { try { es.close(); } catch {} };
  }, []);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/map-locations");
      const data = await res.json();
      if (data.success) setLocations(data.data || []);
      else setError(data.error || "Failed to load");
    } catch (e: any) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    if (!token) return alert("Login required");
    if (!form.name || form.lat == null || form.lng == null) {
      return alert("Name, lat, lng are required");
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/map-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Create failed");
      setForm({ active: true });
      if (!locations.length) fetchLocations();
    } catch (e: any) {
      alert(e.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  const update = async (id: string, patch: Partial<MapLocation>) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/map-locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Update failed");
    } catch (e) {
      console.error(e);
      alert("Update failed");
    }
  };

  const remove = async (id: string) => {
    if (!token) return;
    if (!confirm("Delete this location?")) return;
    try {
      const res = await fetch(`/api/admin/map-locations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Delete failed");
    } catch (e) {
      console.error(e);
      alert("Delete failed");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><MapPin className="h-5 w-5"/> Map Locations</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <Input placeholder="Name" value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="City" value={form.city || ""} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            <Input placeholder="Address" value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input placeholder="Latitude" type="number" value={form.lat ?? ""} onChange={(e) => setForm({ ...form, lat: Number(e.target.value) })} />
            <Input placeholder="Longitude" type="number" value={form.lng ?? ""} onChange={(e) => setForm({ ...form, lng: Number(e.target.value) })} />
            <div className="flex items-center gap-2">
              <input id="active" type="checkbox" checked={form.active !== false} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              <label htmlFor="active" className="text-sm">Active</label>
            </div>
          </div>
          <div className="mt-3">
            <Button disabled={saving} onClick={create} className="bg-[#C70000] hover:bg-[#A60000]">
              <Plus className="h-4 w-4 mr-1"/> Add Location
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Locations ({locations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-gray-600">Loading...</div>
          ) : locations.length === 0 ? (
            <div className="text-gray-500">No locations yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">City</th>
                    <th className="py-2 pr-3">Address</th>
                    <th className="py-2 pr-3">Lat</th>
                    <th className="py-2 pr-3">Lng</th>
                    <th className="py-2 pr-3">Active</th>
                    <th className="py-2 pr-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((loc) => (
                    <tr key={loc._id} className="border-b">
                      <td className="py-2 pr-3"><Input value={loc.name} onChange={(e) => setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, name: e.target.value } : l))} onBlur={(e) => update(loc._id!, { name: e.target.value })} /></td>
                      <td className="py-2 pr-3"><Input value={loc.city || ""} onChange={(e) => setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, city: e.target.value } : l))} onBlur={(e) => update(loc._id!, { city: e.target.value })} /></td>
                      <td className="py-2 pr-3"><Input value={loc.address || ""} onChange={(e) => setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, address: e.target.value } : l))} onBlur={(e) => update(loc._id!, { address: e.target.value })} /></td>
                      <td className="py-2 pr-3"><Input type="number" value={String(loc.lat)} onChange={(e) => setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, lat: Number(e.target.value) } : l))} onBlur={(e) => update(loc._id!, { lat: Number(e.target.value) })} /></td>
                      <td className="py-2 pr-3"><Input type="number" value={String(loc.lng)} onChange={(e) => setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, lng: Number(e.target.value) } : l))} onBlur={(e) => update(loc._id!, { lng: Number(e.target.value) })} /></td>
                      <td className="py-2 pr-3">
                        <input type="checkbox" checked={!!loc.active} onChange={(e) => { setLocations((prev) => prev.map((l) => l._id === loc._id ? { ...l, active: e.target.checked } : l)); update(loc._id!, { active: e.target.checked }); }} />
                      </td>
                      <td className="py-2 pr-3 flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => update(loc._id!, { name: loc.name })}><Save className="h-4 w-4"/></Button>
                        <Button size="sm" variant="destructive" onClick={() => remove(loc._id!)}><Trash2 className="h-4 w-4"/></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
