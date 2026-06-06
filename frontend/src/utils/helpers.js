import { formatDistance, format } from "date-fns";

// Format date relative to now (e.g., "2 hours ago")
export const formatRelativeDate = (date) => {
  return formatDistance(new Date(date), new Date(), { addSuffix: true });
};

// Format date as string (e.g., "Jan 15, 2024")
export const formatDate = (date) => {
  return format(new Date(date), "MMM dd, yyyy");
};

// Format duration in minutes to readable string
export const formatDuration = (minutes) => {
  if (!minutes) return "0 min";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;
  return `${hours} hr ${mins} min`;
};

// Create slug from title
export const createSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

// Format price
export const formatPrice = (price) => {
  if (price === 0) return "Free";
  return `$${parseFloat(price).toFixed(2)}`;
};

// Calculate completion percentage
export const calculateProgress = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
};

// Get level badge color
export const getLevelColor = (level) => {
  const colors = {
    beginner: "badge-success",
    intermediate: "badge-warning",
    advanced: "badge-danger",
  };
  return colors[level] || "badge-primary";
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    draft: "badge-secondary",
    published: "badge-success",
    archived: "badge-danger",
  };
  return colors[status] || "badge-primary";
};

// Validate email
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// File size formatter
export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// Convert standard video URLs to embeddable ones (YouTube/Vimeo)
export const getEmbedUrl = (url) => {
  if (!url) return "";

  // YouTube
  const ytMatch = url.match(
    /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
  );
  if (ytMatch && ytMatch[2].length === 11) {
    return `https://www.youtube.com/embed/${ytMatch[2]}`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  return url;
};
