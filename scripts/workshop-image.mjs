// A language-specific image is optional; otherwise use the shared workshop image.
export const workshopImage = (workshop, translation) => translation.image ?? workshop.image;
