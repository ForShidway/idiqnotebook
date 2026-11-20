import mongoose, { Schema, Document, Model } from "mongoose";

export interface IVocabulary extends Document {
  englishWord: string;
  englishWordNormalized: string;
  indonesianTranslate: string;
  weSpoke: string;
  createdAt: Date;
}

const VocabularySchema = new Schema<IVocabulary>({
  englishWord: {
    type: String,
    required: [true, "English word wajib diisi"],
    trim: true,
  },
  englishWordNormalized: {
    type: String,
    required: [true, "Normalized English word wajib diisi"],
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
  },
  indonesianTranslate: {
    type: String,
    required: [true, "Indonesian translate wajib diisi"],
    trim: true,
  },
  weSpoke: {
    type: String,
    required: [true, "We Spoke (Cara Baca) wajib diisi"],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Vocabulary: Model<IVocabulary> =
  mongoose.models.Vocabulary ||
  mongoose.model<IVocabulary>("Vocabulary", VocabularySchema);

export default Vocabulary;
