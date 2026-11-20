import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVideoLesson extends Document {
  title: string;
  videoUrl: string;
  content: string;
  createdAt: Date;
}

const VideoLessonSchema = new Schema<IVideoLesson>({
  title: {
    type: String,
    required: [true, "Judul materi wajib diisi"],
    trim: true,
  },
  videoUrl: {
    type: String,
    required: [true, "Link video YouTube wajib diisi"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Konten teks penjelasan wajib diisi"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const VideoLesson: Model<IVideoLesson> =
  mongoose.models.VideoLesson ||
  mongoose.model<IVideoLesson>("VideoLesson", VideoLessonSchema);

export default VideoLesson;
