# voteTrack
Hi there,
voteTrack is an application built with Node.js for managing polls, it enables registered users (admins) to create polls valid for a specific period of time, regular registered users to participate in the polls, and provides live and final results at the end of the poll period.

## Features
1. User Registration: Users can create an account with their name, email, and password. There can be regular users or poll admins. 
2. Poll Creation: Admins can create polls with a specified title, description, options, and duration during which users can vote.
3. User Authentication: User login and authentication are implemented using JWT (JSON Web Tokens) for secure access to protected routes.
4. Poll Participation: Registered users can participate in active polls by selecting one or multiple options and submitting their votes.
5. Real-time Results: Live results are displayed to users during an active poll, allowing them to see the current voting statistics.
6. Final Results: At the end of the poll duration, final results are revealed to all users, displaying the total votes and percentages for each option.
7. Access Control: Only registered and authenticated users can participate in polls. Admins have additional privileges for poll creation and management.
  
## Technologies Used
1. Node.js: Server-side JavaScript runtime environment.
2. Express: Web application framework for Node.js.
3. MongoDB: NoSQL database for storing user and poll data.
4. Mongoose: Object Data Modeling (ODM) library for MongoDB.
5. TypeScript: Typed superset of JavaScript for improved developer productivity.
6. JSON Web Tokens (JWT): Used for user authentication and authorization.
7. bcryptjs: Password hashing and validation.
8. Socket.io: Real-time communication for live results.

## Getting Started
To run the project locally, follow these steps:

1. Clone the repository: git clone `https://github.com/iam-benjamen/voteTrack.git`
2. Install dependencies: `npm install`
3. Configure the environment variables (database connection, JWT secret, etc.).
4. Start the server: `npm run dev`
   
## Contributing
Contributions to voteTrack are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License
This project is licensed under the MIT License.
