// Global ambient declarations and platform-specific augmentations
// Adds non-standard iOS Safari PWA property so we can feature-detect without any casts
interface Navigator {
  standalone?: boolean;
}
