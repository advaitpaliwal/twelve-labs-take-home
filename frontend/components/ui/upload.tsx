"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadVideo } from "@/app/api/video";
import { getOrCreateIndex } from "@/app/api";
import { INDEX_NAME } from "@/lib/constants";
import { checkTaskStatus } from "@/app/api/task";
import { getVideo } from "@/app/api/video";
import { Video } from "@/types/video";

interface InputFileProps {
  onVideoReady: (videoDetails: Video) => void;
  setLoading: (loading: boolean) => void;
}

export function InputFile({ onVideoReady, setLoading }: InputFileProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      setUploading(true);

      try {
        const index = await getOrCreateIndex(INDEX_NAME);
        const uploadResponse = await uploadVideo(index._id, "en", selectedFile);
        checkTaskStatusPeriodically(uploadResponse._id);
      } catch (error) {
        console.error("Upload failed:", error);
        setUploading(false);
      }
    }
  };

  const checkTaskStatusPeriodically = async (taskId: string) => {
    setLoading(true);
    const intervalId = setInterval(async () => {
      try {
        const taskStatus = await checkTaskStatus(taskId);
        if (taskStatus.status === "ready") {
          clearInterval(intervalId);
          const videoDetails = await getVideo(
            taskStatus.index_id,
            taskStatus.video_id
          );
          onVideoReady(videoDetails);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error checking task status:", error);
        clearInterval(intervalId);
      }
    }, 10000);
  };

  return (
    <div className="grid max-w-sm gap-1.5 items-center px-4 py-3 border border-dashed rounded-lg hover:border-solid hover:border-primary transition duration-300 ease-in-out">
      <Label htmlFor="video-file" className="mb-2 text-lg font-medium">
        Upload a video
      </Label>
      <Input
        id="video-file"
        type="file"
        accept=".mp4"
        className="block text-sm justify-left bg-gray-50 rounded-lg border border-gray-300 cursor-pointer focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <p className="text-xs text-gray-500 mt-1">
        {uploading ? "Uploading..." : "MP4 only"}
      </p>
    </div>
  );
}
