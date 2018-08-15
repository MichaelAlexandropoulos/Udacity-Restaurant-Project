STAGE 3 of the Restaurant Project

All the below criteria was met as per requests

-- Users are able to mark a restaurant as a favorite, this toggle is visible in the application.

The user can select a restaurant and at the reviews page will notice at the top right 2 buttons the first button is a toggle button for favorite restaurant. The favorites is a separate table of the database that keeps the name of the restaurant and if it is favorite or not. If there is no record of a specific restaurant it is presumed it is not favorite yet.

-- A form is added to allow users to add their own reviews for a restaurant. Form submission works properly and adds a new review to the database.

The second button is the add review button. When we click it a modal form for entering our review will be show. If we press the send button on the modal form without filling the fields the form will notify us.

-- The client application works offline.

-- JSON responses are cached using the IndexedDB API.

-- Any data previously accessed while connected is reachable while offline.

-- User is able to add a review to a restaurant while offline and the review is sent to the server when connectivity is re-established.

The application runs a fetch event every 30 second to update the reviews data. In the main page (index) there will also display a notification button.

-- The application maintains a responsive design on mobile, tablet and desktop viewports. All new features are responsive, including the form to add a review and the control for marking a restaurant as a favorite.

-- The application retains accessibility features from the previous projects. Images have alternate text, the application uses appropriate focus management for navigation, and semantic elements and ARIA attributes are used correctly. Roles are correctly defined for all elements of the review form.

-- Lighthouse targets for each category exceed: Progressive Web App: >90, Performance: >90, Accessibility: >90