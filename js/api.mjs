// Helper function to generate unique IDs
function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}


// Get images from localStorage
export function getImages() {
    return JSON.parse(localStorage.getItem('galleryImages')) || [];
}

// Save images to localStorage
export function saveImages(images) {
    localStorage.setItem('galleryImages', JSON.stringify(images));
}

// Get comments from localStorage
export function getComments() {
    return JSON.parse(localStorage.getItem('galleryComments')) || [];
}

// Save comments to localStorage
export function saveComments(comments) {
    localStorage.setItem('galleryComments', JSON.stringify(comments));
}

// Add an image to the gallery
export function addImage(title, author, url) {
    const images = getImages();
    const newImage = {
        imageId: generateId(),
        title: title,
        author: author,
        url: url,
        date: new Date().toISOString() // ISO format for consistency
    };
    images.push(newImage);
    saveImages(images);
    return newImage;
}


// Delete an image from the gallery and its associated comments
export function deleteImage(imageId) {
    let images = getImages();
    images = images.filter(image => image.imageId !== imageId);
    saveImages(images);

    // Also delete associated comments
    let comments = getComments();
    comments = comments.filter(comment => comment.imageId !== imageId);
    saveComments(comments);
}


// Add a comment to an image
export function addComment(imageId, author, content) {
    const comments = getComments();
    const newComment = {
        commentId: generateId(),
        imageId: imageId,
        author: author,
        content: content,
        date: new Date().toISOString() // Store in ISO format
    };
    comments.push(newComment);
    saveComments(comments);
}


// Delete a comment
export function deleteComment(commentId) {
    let comments = getComments();
    comments = comments.filter(comment => comment.commentId !== commentId);
    saveComments(comments);
}

// Get comments by imageId (paginated: returns up to 10)
export function getCommentsByImage(imageId, page = 1, pageSize = 10) {
    // Fetch all comments for the specified image
    let comments = getComments().filter(comment => comment.imageId === imageId);

    // Sort comments by date in descending order (newest first)
    comments.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalComments = comments.length;
    const totalPages = Math.ceil(totalComments / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    // Slice the sorted array to get the paginated comments
    const paginatedComments = comments.slice(startIndex, endIndex);

    return { comments: paginatedComments, totalComments };
}
