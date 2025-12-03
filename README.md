# Nerds-TigerTix-Project
Nerds TigerTix Project for CPSC 3720, Fall 2025

README - TigerTix

1	PROJECT OVERVIEW
1.1	PURPOSE & FEATURES
    TigerTix is a web application that strives to make reserving tickets for Clemson University campus events simple, organized, and convenient. Users are able to browse listed events, reserve tickets, and manage their profiles. Users also have access to accessibility features, such as a voice-enabled conversational interface and LLM-driven ticket booking. These components, condensed into a single application, address the overlying issue of having to search through different websites to find and reserve event tickets.
1.2	LINK TO LIVE APPLICATION
	https://tigertix-frontend.vercel.app/ 
1.3	LINK TO GITHUB REPOSITORY
	https://github.com/gasimovic/Nerds-TigerTix-Project 

2	TECH STACK
2.1	DEVELOPMENT TOOLS
    JavaScript: programming language
    React: frontend development
    Node.js: backend development
    Express: backend development
    SQLite3: database
    GPT-4o mini: LLM
    Jest: regression testing

3	ARCHITECTURE SUMMARY
3.1	MICROSERVICES
    user-authentication, admin-service, client-service, llm-driven-booking
3.2	DATA FLOW
    The user can interact with the frontend of the application by performing actions, like browsing events, or clicking a button to purchase tickets. The frontend sends user interactions to the user-authentication service, which handles user registration and login, token-based authentication, and logout and session handling. After the user is authenticated, the client-service processes user actions to fetch event data from the shared database and to update ticket counts. The shared database returns event data to the client-service, and the client-services returns event listings to the frontend. The frontend interacts with the admin-service by sending it user requests. The admin-service then interacts with the shared database to create new events and update existing event data. The frontend also sends user input data, like user speech, to the llm-driven-booking service. The llm-driven-booking service handles the data and interacts with the shared database to prepare ticket bookings. The shared database returns event booking data, which the llm-driven-booking service uses to send the LLM’s response to the frontend. In all, the user-authentication, admin-service, client-service, and llm-driven-booking microservices work in tandem to connect the frontend and the shared database.

4	INSTALLATION & SETUP INSTRUCTIONS
4.1	HOW TO INSTALL THE PROJECT FILES
    Visit the project’s GitHub repo webpage and download the code ZIP file. Extract the project files into a local folder.
4.2	HOW TO MANUALLY RUN THE APPLICATION (WINDOWS)
    Launch the Client Service:
        In a terminal, navigate to the “client-service” directory and enter the commands “Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass” and “node server.js”.
    Launch the Admin Service:
        In another terminal, navigate to the “admin-service” directory and enter the commands “node server.js”.
    Launch the LLM Driven Booking Service:
        In another terminal, navigate to the “llm-driven-booking” directory and enter the command “node server.js”.
    Launch the User Authentication Service:
        In another terminal, navigate to the “user-authentication” directory and enter the command “node server.js”.
    Launch the Frontend:
        In another terminal, navigate to the “frontend” directory and enter the commands “npm install” and “npm start”.
    Note: the installation of additional packets and dependencies may be required in order to execute the code

5	ENVIRONMENT VARIABLES SETUP: NAMES & VALUES
5.1	USER-AUTHENTICATION
    PORT | 9001
    JWT_SECRET | ‘dev-secret-change-me’
5.2	ADMIN-SERVICE
    PORT | 5001
5.3	CLIENT-SERVICE
    PORT | 6001
5.4	LLM-DRIVEN-BOOKING
    PORT | 7001
    CLIENT_API_BASE | “”
    LLM_MODEL | ‘gpt-4o-mini’
    OPENAI_API_KEY | new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
5.5	FRONTEND
    REACT_APP_CLIENT_API_BASE | “http://localhost:6001”
    REACT_APP_LLM_API_BASE | “http://localhost:7001”
    REACT_APP_AUTH_API_BASE | “http://localhost:9001”

6	HOW TO RUN REGRESSION TESTS
6.1	BACKEND & FRONTEND INSTRUCTIONS
    To test the backend, open a terminal and navigate to the “backend” directory. Then, enter the command “npm test”. To test the frontend, navigate to the “frontend” directory. Then, enter the command “npm test”.
    Note: the installation of Jest is required to run these tests

7	PROJECT CREDIT & ROLES
7.1	TEAM MEMBERS, INSTRUCTORS, TAs
    Jim Daou, Tester
    Elnur Gasimov, Lead Programmer
    Gabriella Hoegy, Scrum Master & Programmer
    Dr. Julian Brinkley, Instructor
    Atik Enam, TA
    Colt Doster, TA

8	LICENSE
8.1	LICENSE TYPE
    This project is licensed under the terms of the MIT license. Please refer to LICENSE.txt in the GitHub project repository (https://github.com/gasimovic/Nerds-TigerTix-Project) for more details.