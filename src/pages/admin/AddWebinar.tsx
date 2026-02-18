import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { useDarkMode } from "@/contexts/DarkModeContext";

export default function AddWebinar() {
  const navigate = useNavigate();
  const { isDarkMode } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration_minutes: "",
    speaker_name: "",
    speaker_title: "",
    speaker_image: "",
    cover_image: "",
    webinar_link: "",
    max_attendees: "",
    price: "0",
    is_free: true,
    status: "upcoming"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem("authToken");
      await axios.post(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/webinars/admin`,
        {
          ...formData,
          duration_minutes: parseInt(formData.duration_minutes),
          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          price: parseFloat(formData.price),
          is_free: formData.is_free
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Webinar created successfully");
      navigate("/admin/webinars");
    } catch (error) {
      toast.error("Failed to create webinar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-white dark:bg-black">
      <Button
        variant="ghost"
        onClick={() => navigate("/admin/webinars")}
        className="mb-6 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Webinars
      </Button>

      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Add New Webinar</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>

            <div>
              <Label>Time</Label>
              <Input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duration (minutes)</Label>
              <Input
                type="number"
                required
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
              />
            </div>

            <div>
              <Label>Max Attendees (optional)</Label>
              <Input
                type="number"
                value={formData.max_attendees}
                onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Webinar Type</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={formData.is_free}
                  onChange={() => setFormData({ ...formData, is_free: true, price: "0" })}
                  className="w-4 h-4"
                />
                Free
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={!formData.is_free}
                  onChange={() => setFormData({ ...formData, is_free: false })}
                  className="w-4 h-4"
                />
                Paid
              </label>
            </div>
          </div>

          {!formData.is_free && (
            <div>
              <Label>Price ($)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Speaker Name</Label>
              <Input
                required
                value={formData.speaker_name}
                onChange={(e) => setFormData({ ...formData, speaker_name: e.target.value })}
              />
            </div>

            <div>
              <Label>Speaker Title</Label>
              <Input
                required
                value={formData.speaker_title}
                onChange={(e) => setFormData({ ...formData, speaker_title: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Speaker Image URL (optional)</Label>
            <Input
              type="url"
              placeholder="https://example.com/speaker-image.jpg"
              value={formData.speaker_image}
              onChange={(e) => setFormData({ ...formData, speaker_image: e.target.value })}
            />
          </div>

          <div>
            <Label>Cover Image URL (optional)</Label>
            <Input
              type="url"
              placeholder="https://example.com/webinar-cover.jpg"
              value={formData.cover_image}
              onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
            />
          </div>

          <div>
            <Label>Webinar Link (optional)</Label>
            <Input
              type="url"
              placeholder="https://zoom.us/j/123456789"
              value={formData.webinar_link}
              onChange={(e) => setFormData({ ...formData, webinar_link: e.target.value })}
            />
            <p className="text-sm text-gray-500 mt-1">Link to join the webinar (Zoom, Teams, etc.) - used for reminder emails</p>
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? "Creating..." : "Create Webinar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/admin/webinars")}
              className="border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
