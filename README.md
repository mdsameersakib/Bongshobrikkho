# Family Tree Visualizer

A web application for building, visualizing, and sharing your family tree. This project allows users to create detailed profiles for family members, define their relationships, and view the entire family structure in an interactive and easy-to-understand diagram.

## Features

*   **Interactive Family Tree:** Visualize your family history as a beautiful, zoomable, and pannable tree diagram.
*   **Detailed Profiles:** Add and edit information for each family member, including names, birth/death dates, photos, and more.
*   **Relationship Management:** Easily define relationships between family members (parent, child, spouse).
*   **User Invitations:** Invite family members to join and collaborate on the family tree. New users can claim a profile that has already been created for them.
*   **Family Wall:** A shared space for family members to post updates and photos.
*   **Event Tracking:** Keep track of important family events like birthdays and anniversaries.
*   **Secure Authentication:** User accounts are managed securely using Firebase Authentication.

## Technologies Used

### Frontend

*   **React:** A JavaScript library for building user interfaces.
*   **Reactflow:** A library for creating node-based graphs, used here to render the family tree.
*   **Zustand:** A small, fast, and scalable state-management solution for React.
*   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
*   **React Router:** For client-side routing within the single-page application.
*   **Firebase SDK:** For interacting with Firebase services (Auth, Firestore) from the client.

### Backend

*   **Firebase:** A comprehensive platform for building web and mobile applications.
    *   **Firestore:** A flexible, scalable NoSQL cloud database for storing application data.
    *   **Firebase Authentication:** For handling user sign-up, login, and session management.
    *   **Firebase Cloud Functions:** For running server-side logic in a serverless environment.
    *   **Firebase Hosting:** For deploying and hosting the web application.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   **Node.js:** Make sure you have Node.js installed. You can download it from [nodejs.org](https://nodejs.org/).
*   **Firebase CLI:** You'll need the Firebase Command Line Interface to run the functions emulator and deploy the project. Install it globally via npm:
    ```sh
    npm install -g firebase-tools
    ```

### Firebase Setup

1.  **Create a Firebase Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Enable Services:** In your new project, enable the following services:
    *   **Firestore Database:** Create a new Firestore database.
    *   **Authentication:** Enable the "Email/Password" sign-in method.
3.  **Register a Web App:** In your project's settings, add a new "Web" app. This will give you a Firebase configuration object (with `apiKey`, `authDomain`, etc.).
4.  **Configure Frontend:**
    *   Create a `.env` file in the `frontend` directory.
    *   Copy your Firebase web app configuration into the `.env` file like this:
        ```
        REACT_APP_FIREBASE_API_KEY=your_api_key
        REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
        REACT_APP_FIREBASE_PROJECT_ID=your_project_id
        REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
        REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
        REACT_APP_FIREBASE_APP_ID=your_app_id
        ```
5.  **Configure Backend:**
    *   In the root of the repository, associate your local project with your Firebase project by running:
        ```sh
        firebase use --add
        ```
    *   Select your new Firebase project from the list.

### Installation & Running

1.  **Clone the repo:**
    ```sh
    git clone https://github.com/your_username/your_repository.git
    cd your_repository
    ```
2.  **Install Frontend Dependencies:**
    ```sh
    cd frontend
    npm install
    ```
3.  **Install Backend Dependencies:**
    ```sh
    cd ../functions
    npm install
    ```
4.  **Run the Development Servers:**
    *   **Start the React App:** In the `frontend` directory, run:
        ```sh
        npm start
        ```
        This will open the app in your browser at `http://localhost:3000`.
    *   **Start the Firebase Emulators:** In a separate terminal, from the root of the repository, run:
        ```sh
        firebase emulators:start --only functions
        ```
        This will run the Cloud Functions locally.

## Project Structure

```
.
├── firebase.json         # Firebase project configuration
├── firestore.rules       # Security rules for Firestore
├── functions/            # Backend Firebase Cloud Functions
│   ├── index.js          # Main entry point for Cloud Functions
│   └── package.json      # Backend dependencies
└── frontend/             # Frontend React application
    ├── public/           # Public assets
    ├── src/              # React source code
    └── package.json      # Frontend dependencies
```
