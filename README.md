# Workout Log Web Application

This application allows a user to enter their workout data and save it to view or update at a later date. It also includes a one-rep max calculator page that calculates your one-rep max based on the weight, reps, and RPE (Rate of Perceived Exertion) of a set you performed in the past. A table is displayed showing the estimated weight you can lift between 1-10 reps at RPE 6-10. View the deployed website at [https://workoutlogapp.vercel.app](https://workoutlogapp.vercel.app).

### Workout Page

![Image of workout page](/public/img/workout_dark.webp)

When a new workout is started, the title is defaulted to \[Today's Date YYYY-MM-dd\] Workout, the date is defaulted to today, and there is an optional section for overal workout notes.

The 'Add Exercise' button opens a modal that shows a list of pre-loaded exercises, and has tabs for user-created exercises and new exercise creation. Once an exercise is selected or a new exercise is created, it can be added to the workout.

The exercise card has an options button that allows you to change the weight unit from lbs to kg, and a switch to show or hide the estimated one-rep max. An actions button beside the exercise title allows you to change the exercise, view your history of performing that exercise, or delete the exercise. The inputs include a notes section \(useful for set and rep targets\), and weight, reps, and RPE. All of these inputs have rules enforced by regex patterns, and on mobile devices, the numeric keyboard with a decimal is opened \(**Weight:** 0-9999, only 0 or 5 after the decimal. **Reps:** 0-9999, whole numbers. **RPE:** 0-10, 0 or 5 after the decimal.\). Each set has a delete button, and sets can be added with the 'Add set' button. If there are any sets present between 1-10 reps at RPE 6-10, the estimated one-rep max will be calculated based on your best set is and displayed below the sets grid.

Once you are finished inputting your workout data, it can be saved by pressing the 'Save Workout' button, and this same button will update existing workouts. If it is a new, unsaved workout, there is a cancel button, and existing workouts have a delete button that will soft-delete the workout and remove it from the workout history view.

### History Page

![Image of history page](/public/img/history_dark.webp)

The history page displays all of the logged in user's saved workouts in a card including the title, date, notes, and a list of exercises performed. The 'View/Edit' link will open the workout on the workout page.

The workouts can be filtered by date range, and grouped by month or week. 

### Calculator Page

![Image of calculator page](/public/img/calculator_dark.webp)

The calculator page allows you to enter the weight, reps, and RPE values for a set you have performed, and it will calculate your estimated one-rep max, along with a table of estimated weights you can lift between 1-10 reps at RPE 6-10. The input rules are slightly different on this page. Reps must be between 1-10, and RPE must be between 6-10. If you are interested in how this calculation is done and are curious about RPE, you can read [this article](https://fiftyonestrong.com/rpe/). If you are interested in how I did these calculations programatically, see [/utils/calculator/calc-functions.ts](/utils/calculator/calc-functions.ts).

### Login/Sign up Page

![Image of login page](/public/img/login.webp)

Users have the option to login with an email magic link, or with email and password. The sign up page requires an email address, password, and a display name. The authentication is handled by Supabase Auth. If there is no logged in user, navigating to the workout or history pages will redirect the user to this page. The home page and calculator pages do not require authentication because they do not display or save any user data.

## Testing

If you would like to test this application without creating an account, you may use the Test User account. Please do not send magic links to this email, only sign in with credentials.

Email: workoutlogtestuser@gmail.com
<br>
Password: testuserpassword

Please be respectful and do not save anything inappropriate in the notes sections on this account.

## Tech Stack

### Frontend

- Next.js
- React
- Typescript
- Next UI
- Tailwind CSS

### Backend

- Supabase \(Postgres database with built-in Auth\)
- Prisma ORM

## Challenges

- I only had a little under three weeks to complete this project during my break between semesters. This was a good exercise in working with tight deadlines. It was also a good exercise in building something that is ready to deliver, but not yet perfect. I can continue to improve this over time.
- This was my first time creating a full-stack application from scratch with Next.js. In school, I have built full-stack applications with .NET Blazor (with pre-built SQL databases stored locally), but my React course was focused on frontend. Having to use API calls to access a remote database was a new learning experience for me.
- Since my backend experience is in C#, I decided to use Typescript so I could have strongly-typed view models of my database entities to mimic my workflow in .NET. This resulted in unforseen challenges related to Typescript requiring definitions for absolutely everything including component props, and needing to use union types if a value may be null or undefined. Having to think about the possible values for all of my variables was a great learning experience.
- My database schema has multiple layers of one-to-many relationships that made CRUD operations for Workouts more difficult than what I am used to. My school projects typically involved tables like Orders > OrderDetails, but this project has Workouts > WorkoutExercises > Sets. This also made state updates to my workout object on the frontend challenging if there were changes to exercises or sets. 
- This was my first time creating a multi-user application with authentication, so I had to spend a lot of time learning about the basic concepts of sessions and tokens. This influenced my decision to use Supabase because their built-in auth library is very easy to use.

## Future Improvements

- Add an account management page to change email, display name, and reset password. 
- Add an analytics page with charts to monitor exercise progress over time (one-rep max, tonnage, total reps, volume, etc.)
- Add a user dashboard showing recent workouts and options to show progress charts for selected exercises.
- Rebuild as a mobile application

## Known Bugs/Issues

- Some components do not have a great user experience on mobile. The virtual keyboard pushes up the exercise selection modal making it difficult to see your search results while typing. The inputs on the one-rep max calculator modal are pushed completely off the screen when the keyboard is open, so you can not see what you are typing. The calculator modal on the workout page is a nice-to-have feature and is not required to log a workout.
- The one-rep max calculation sometimes differs by 1 lbs/kg due to floating point precision. This is not a huge issue since this is an estimate, and 1 lbs/kg is almost negligible since most weights in commercial gyms are not precise. 