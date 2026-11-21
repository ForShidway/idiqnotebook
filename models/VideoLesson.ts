import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVideoLessonPage {
  videoUrl: string;
  content: string;
}

export interface IVideoLesson extends Document {
  title: string;
  videoUrl: string;
  content: string;
  pages?: IVideoLessonPage[];
  createdAt: Date;
}

const VideoLessonPageSchema = new Schema<IVideoLessonPage>(
  {
    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Konten teks penjelasan halaman wajib diisi"],
    },
  },
  { _id: false }
);

const VideoLessonSchema = new Schema<IVideoLesson>({
  title: {
    type: String,
    required: [true, "Judul materi wajib diisi"],
    trim: true,
  },
  videoUrl: {
    type: String,
    required: [true, "Link video YouTube halaman pertama wajib diisi"],
    trim: true,
  },
  content: {
    type: String,
    required: [true, "Konten teks penjelasan wajib diisi"],
  },
  pages: {
    type: [VideoLessonPageSchema],
    default: [],
    validate: {
      validator: function (val: IVideoLessonPage[]) {
        return !val || val.length <= 5;
      },
      message: "Jumlah halaman dalam satu materi maksimal adalah 5 halaman.",
    },
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
