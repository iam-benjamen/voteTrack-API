# voteTrack REST API
Hi there, Welcome to voteTrack project documentation! This guide will help you understand the project, set it up locally, and explore its features. Feel free to contribute and make the documentation even better!

voteTrack is a Node.js application for managing polls, it enables admins to create polls valid for a specified period of time, and registered voters to participate in the polls, it also provides live and final results at the end of the poll period. The admin specifies whether the poll is open to anyone or invited voters only.

## Features
1. User authentication and authorization
2. Creation and management of polls
3. Support for invite-only and open participation polls
4. Invitation-based voting system
5. Real-time & final voting results

```
|--src\
   |--controllers\    # Route controllers (controller layer)
   |--models\         # Mongoose models (data layer)
   |--routes\         # API Routes
   |--types\          # custom types
   |--utils\          # Utility classes and functions
   |--config\         # Environment variables and configuration-related things
   |--db.ts           # database configurations
   |--app.ts          # Express app
   |--index.ts        # App entry point

|--tests\
 ```

## Technologies
- **Node.js**: Server-side JavaScript runtime environment.
- **[Express](https:www.expressjs.com)**: Web application framework for Node.js.
- **TypeScript**: Typed superset of JavaScript 
- **[MongoDB](https://www.mongodb.com) & [Mongoose](https://mongoosejs.com)**: NoSQL database & Object Data Modeling (ODM) library for MongoDB.
- **JSON Web Tokens (JWT)**: Used for user authentication and authorization.
- **Environment variables**: using [dotenv](https://github.com/motdotla/dotenv)  
- **Bcryptjs**: Password hashing and validation.
- **Node-cron**: Task scheduling library
- **Nodemailer**: Mailing service
- **CORS**: Cross-Origin Resource-Sharing enabled using [cors](https://github.com/expressjs/cors)
- **Express-session**: managing server session
- **Testing**: unit and integration tests using [Jest](https://jestjs.io)

## Getting Started
To run the project locally, follow these steps:

1. Clone the repository:
   git clone `https://github.com/iam-benjamen/voteTrack.git`
2. Install dependencies: `npm install`
3. Configure the environment variables (database connection, JWT secret, etc.).
4. Start the server: `npm run dev`
   
## Contributing
Contributions to voteTrack are welcome! If you find any issues or have suggestions for improvements, please open an issue or submit a pull request.

## License
This project is licensed under the MIT License.
