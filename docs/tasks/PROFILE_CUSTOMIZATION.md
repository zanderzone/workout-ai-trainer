# Profile and Avatar Customization Feature

## Overview
Add user profile customization capabilities to enhance user personalization and identity within the Workout AI Trainer app.

## Requirements

### Profile Information
- [ ] Allow users to update their display name
- [ ] Add ability to set and update profile picture
- [ ] Support for uploading custom images
- [ ] Option to use default avatars/icons
- [ ] Add optional bio/description field

### Avatar Features
- [ ] Default avatar showing initials (currently implemented)
- [ ] Upload custom profile picture
  - [ ] Image upload with preview
  - [ ] Image cropping/resizing
  - [ ] File size and type validation
- [ ] Gallery of preset avatars to choose from
- [ ] Support for removing/resetting avatar

### Technical Requirements
- [ ] Image storage solution (e.g., S3, CloudFront)
- [ ] Image processing for different sizes
  - [ ] Thumbnail for header (32x32)
  - [ ] Medium size for profile (128x128)
  - [ ] Full size for profile page (256x256)
- [ ] Database schema updates
  - [ ] Add avatar URL field
  - [ ] Add avatar type field (initials/custom/preset)
  - [ ] Add additional profile fields

### UI/UX Requirements
- [ ] Profile settings page
- [ ] Avatar upload modal
- [ ] Image cropping interface
- [ ] Loading states for image upload
- [ ] Error handling for failed uploads
- [ ] Responsive design for all screen sizes

## Implementation Notes
1. Current header component (`Header.tsx`) uses initials-based avatar
2. Need to maintain fallback to initials if image fails to load
3. Consider implementing progressive image loading
4. Cache avatar images for better performance

## Security Considerations
- [ ] File type validation
- [ ] File size limits
- [ ] Secure URL generation for uploads
- [ ] Content moderation for uploaded images
- [ ] CORS configuration for image storage

## API Endpoints Needed
```typescript
// Profile endpoints
POST /api/profile/update
PATCH /api/profile/avatar
DELETE /api/profile/avatar

// Avatar upload
POST /api/upload/avatar
GET /api/avatars/presets
```

## Database Schema Updates
```typescript
interface UserProfile {
  // Existing fields
  providerId: string;
  email: string;
  
  // New fields
  avatarUrl?: string;
  avatarType: 'initials' | 'custom' | 'preset';
  bio?: string;
  customFields?: {
    [key: string]: string;
  };
}
```

## Future Enhancements
- Social media links
- Achievement badges
- Profile themes/colors
- Profile visibility settings
- Activity/workout history display

## Dependencies
- Image upload library (e.g., react-dropzone)
- Image cropping tool (e.g., react-image-crop)
- Cloud storage solution
- Image optimization service

## Estimated Timeline
- Backend implementation: 3-4 days
- Frontend implementation: 4-5 days
- Testing and refinement: 2-3 days
- Total: ~2 weeks

## Related Components
- `Header.tsx` (existing)
- `ProfilePage.tsx` (to be created)
- `AvatarUpload.tsx` (to be created)
- `ProfileSettings.tsx` (to be created) 