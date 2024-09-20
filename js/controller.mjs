import { getImages, addImage, deleteImage, addComment, getCommentsByImage, deleteComment } from './api.mjs';

let currentImageIndex = 0; // Track which image is currently displayed
let currentCommentPage = 1; // Track the comment pagination

// Initialize gallery and display the first image
function initGallery() {
    const images = getImages();
    if (images.length > 0) {
        displayImage(images[0]);
        document.getElementById('image-display').style.display = 'block';
    } else {
        document.getElementById('image-display').style.display = 'none';
        document.getElementById('comment-form').style.display = 'none'; // Hide the comment form
        document.getElementById('comments-section').style.display = 'none'; // Hide the comments section
        document.getElementById('comment-navigation').style.display = 'none'; // Hide the comment navigation buttons
    }
}

document.getElementById('add-image-btn').addEventListener('click', function () {
    const imageForm = document.getElementById('create_message_form');
    if (imageForm.style.display === 'none' || imageForm.style.display === '') {
        imageForm.style.display = 'block';
        this.textContent = 'Hide Form';
    } else {
        imageForm.style.display = 'none';
        this.textContent = 'Add Image';
    }
});

function displayImage(image) {
    const commentForm = document.getElementById('comment-form');
    const commentsSection = document.getElementById('comments-section');
    const commentNavigation = document.getElementById('comment-navigation');

    if (image) {
        document.getElementById('current-image').src = image.url;
        document.getElementById('current-image').alt = "Displayed image";
        document.getElementById('image-title').innerText = image.title;
        document.getElementById('image-author').innerText = `by ${image.author}`;
        document.getElementById('image-display').style.display = 'block';

        commentsSection.style.display = 'block'; // Show comments section
        commentForm.style.display = 'flex'; // Show comment form
        commentNavigation.style.display = 'block'; // Show navigation buttons

        // Immediately find the most recent page of comments for the displayed image
        setCurrentCommentPageToMostRecent(image.imageId);
    } else {
        document.getElementById('image-display').style.display = 'none';
        commentsSection.style.display = 'none'; // Hide comments section
        commentForm.style.display = 'none'; // Hide comment form
        commentNavigation.style.display = 'none'; // Hide navigation buttons
    }
}

function setCurrentCommentPageToMostRecent(imageId) {
    // Fetch the total number of comments to determine the last page
    const { totalComments } = getCommentsByImage(imageId, 1); // Fetching any page will give total comments count
    const pageSize = 10; //The page size is 10
    const totalPages = Math.ceil(totalComments / pageSize);
    currentCommentPage = 1; // Set to the last page which will have the most recent comments
    loadComments(imageId); // Now load the comments for this page
}

function loadComments(imageId) {
    // Fetch paginated comments and total comments count
    const { comments, totalComments } = getCommentsByImage(imageId, currentCommentPage);
    const totalPages = Math.ceil(totalComments / 10);

    // Update the navigation buttons
    updateNavigationButtons(currentCommentPage, totalPages);

    // Clear previous comments
    const commentsSection = document.getElementById('comments-section');
    commentsSection.innerHTML = '';

    // Display comments or show a "No comments available" message
    if (comments.length > 0) {
        console.log('Rendering comments:', comments);
        comments.forEach(comment => {
            const commentElement = document.createElement('div');
            commentElement.classList.add('comment');
            commentElement.innerHTML = `
                <div class="comment-author">${comment.author}</div>
                <div class="comment-date">Posted on: ${new Date(comment.date).toLocaleDateString()}</div>
                <div class="comment-text">${comment.content}</div>
                <div class="comment-actions">
                    <button class="delete-btn" data-id="${comment.commentId}">Delete</button>
                </div>`;
            commentsSection.appendChild(commentElement);
        });
        commentsSection.style.display = 'block';
        setupDeleteCommentListeners();
    } else {
        commentsSection.innerHTML = '<p>No comments available.</p>';
        commentsSection.style.display = 'block';
    }
}


function updateNavigationButtons(currentPage, totalPages) {
    const olderCommentsBtn = document.querySelector('#comment-navigation .nav-btn:first-of-type');
    const moreRecentCommentsBtn = document.querySelector('#comment-navigation .nav-btn:last-of-type');

    olderCommentsBtn.disabled = currentPage >= totalPages;
    moreRecentCommentsBtn.disabled = currentPage <= 1;
}

function setupDeleteCommentListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function () {
            const commentId = this.getAttribute('data-id');
            deleteComment(commentId);
            
            const currentImageId = getImages()[currentImageIndex].imageId;

            // After deletion, check if there are any comments left on the current page
            const { comments } = getCommentsByImage(currentImageId, currentCommentPage);

            if (comments.length === 0) {
                // If no comments left on this page, attempt to load the next page with comments
                findNextPageWithComments(currentImageId);
            } else {
                // Otherwise, reload the current page
                loadComments(currentImageId);
            }
        });
    });
}

// Function to find the next page with comments
function findNextPageWithComments(imageId) {
    let page = currentCommentPage;
    const totalComments = getCommentsByImage(imageId).totalComments; // Get total comments
    const totalPages = Math.ceil(totalComments / 10); // 10 comments per page
    
    // Look for more recent pages first (pages with lower numbers)
    while (page > 1) {
        page--;
        const { comments } = getCommentsByImage(imageId, page);
        if (comments.length > 0) {
            currentCommentPage = page;
            loadComments(imageId);
            return;
        }
    }
    
    // If no more recent pages, look for older pages
    page = currentCommentPage;
    while (page < totalPages) {
        page++;
        const { comments } = getCommentsByImage(imageId, page);
        if (comments.length > 0) {
            currentCommentPage = page;
            loadComments(imageId);
            return;
        }
    }
    
    // If no comments are left on any page, reload the empty state
    loadComments(imageId);
}


document.getElementById('create_message_form').addEventListener('submit', function (e) {
    e.preventDefault();
    
    const title = this.querySelector('input[name="user_name"]').value;
    const author = this.querySelector('input[name="author_name"]').value;
    const url = this.querySelector('textarea[name="url"]').value;
    
    // Add the image
    const newImage = addImage(title, author, url);
    
    // Update the gallery to show the new image
    currentImageIndex = getImages().length - 1;
    displayImage(newImage);

    // Clear the comments section because the new image has no comments initially
    clearCommentsSection();
    
    // Hide the form and reset it
    document.getElementById('create_message_form').style.display = 'none';
    document.getElementById('add-image-btn').textContent = 'Add Image';
    document.getElementById('image-display').style.display = 'block';
    this.reset();  //clear the form
    
    // Display the success message
    const successMessage = document.getElementById('success-message');
    successMessage.style.display = 'block';
    
    // Hide the success message after 2 seconds
    setTimeout(function() {
        successMessage.style.display = 'none';
    }, 2000);
});

// Function to clear comments section
function clearCommentsSection() {
    const commentsSection = document.getElementById('comments-section');
    commentsSection.innerHTML = ''; // Clear any existing comments
    commentsSection.style.display = 'none'; // Optionally hide the section if no comments
}

document.getElementById('comment-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const author = this.querySelector('#comment-author').value;
    const content = this.querySelector('#comment-text').value;
    const currentImage = getImages()[currentImageIndex];
    addComment(currentImage.imageId, author, content);
    loadComments(currentImage.imageId);
    this.reset();
});

document.getElementById('prev-btn').addEventListener('click', function () {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        const currentImage = getImages()[currentImageIndex];
        displayImage(currentImage);
        loadComments(currentImage.imageId); // Load comments for the image
    }
});

document.getElementById('next-btn').addEventListener('click', function () {
    if (currentImageIndex < getImages().length - 1) {
        currentImageIndex++;
        const currentImage = getImages()[currentImageIndex];
        displayImage(currentImage);
        loadComments(currentImage.imageId); // Load comments for the image
    }
});

document.getElementById('delete-btn').addEventListener('click', function() {
    const images = getImages(); // Fetch the current list of images
    if (images.length > 0 && currentImageIndex >= 0) {
        deleteImage(images[currentImageIndex].imageId); // Delete the current image

        // Fetch the updated list of images after deletion
        const updatedImages = getImages();

        // Check if there are still images left after deletion
        if (updatedImages.length > 0) {
            // Adjust the currentImageIndex if necessary
            if (currentImageIndex >= updatedImages.length) {
                currentImageIndex = updatedImages.length - 1;
            }
            displayImage(updatedImages[currentImageIndex]); // Display the next or previous image
        } else {
            // If no images are left, hide the image display area and reset the currentImageIndex
            document.getElementById('image-display').style.display = 'none';
            document.getElementById('comments-section').style.display = 'none';
            document.getElementById('comment-navigation').style.display = 'none';
            document.getElementById('comment-form').style.display = 'none'; // Hide the comment form
            currentImageIndex = -1; // Reset index because there are no images left
            clearImageDisplay(); // Clear the display of any image details
        }
    }
});

function clearImageDisplay() {
    document.getElementById('current-image').src = ""; // Clear the image source
    document.getElementById('image-title').innerText = ""; // Clear the image title
    document.getElementById('image-author').innerText = ""; // Clear the image author
    document.getElementById('comments-section').innerHTML = ""; // Clear any comments
}

// "Older Comments" button event listener
document.querySelector('#comment-navigation .nav-btn:first-of-type').addEventListener('click', function () {
    const currentImage = getImages()[currentImageIndex];
    const totalComments = getCommentsByImage(currentImage.imageId).totalComments; // Get total comments from API
    const totalPages = Math.ceil(totalComments / 10); // 10 comments per page

    if (currentCommentPage < totalPages) {
        currentCommentPage++;
        loadComments(currentImage.imageId); // Load the older comments (next page)
    }
});

// "More Recent Comments" button event listener
document.querySelector('#comment-navigation .nav-btn:last-of-type').addEventListener('click', function () {
    if (currentCommentPage > 1) {
        currentCommentPage--;
        const currentImage = getImages()[currentImageIndex];
        loadComments(currentImage.imageId); // Load the more recent comments (previous page)
    }
});



window.onload = function () {
    initGallery();
    
};
