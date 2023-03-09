                                        Tourn it Up B
                        
Description: 
Our App allows people to create challenges among each other. they can be scientifical, Enternaining and much more.
guests can participate in a chalenge,premier Users can create and organize a challenge. one can recieve awards if he won a challenge and this prize can be  "participating in a new startUp which requires specific proffessions" .
Feel free to navigate through the Tournaments based on your interrests and location.

Services:
Auth Service
        auth.login(user)  // user do it through FrontEnd
        auth.signup(user)   // user do it through
        auth.logout()
        auth.getUser() // synchronous
Tournaments Service
        Tournaments.list()
        Tournaments.create(data)
        Tournaments.detail(id)
        Tournaments.remove(id)
        Tournaments.Update(id)
comments services:
         comments.create()
         comments.delete()
         comments.update()
Models:
    User.Model
    Tournamet.Model
    Comment.Model

API Endpoints/Backend Routes
Auth Routes:
GET  /auth/profile
POST /auth/profile/addFriend
POST /auth/signup
        body:
            username
            email
            password
POST /auth/login
        body:
            email
            password
POST /auth/logout
        Button-Delete Token
GET  /comments/delete/:id
POST /profile/settings
POST /profile/delete
POST /update-membership-plan
POST /uploadavatar/:username
POST /uploadbg/:username

Tornament Routs:
POST /tournaments/create
POST /tournaments/update/:id
POST /tournaments/delete/:id
POST /tournaments/updateparticipants/:id
GET  /tournaments/all
GET  /tournaments/:id
GET  /tournaments/search/find-name/:name
POST /tournaments/comments/add
POST /tournaments/upload/:tournamentId
POST /tournaments/update-values/:tournamentId
POST /tournaments/comments/delete/:id

Index Routes:
Get  /api

TRELLO:
https://trello.com/b/Fv24hjnw/awesome-idea-organization

Git:
BACKEND: https://github.com/MaikSchmi/tourn-it-up-b
FRONTEND: https://github.com/MaikSchmi/tourn-it-up-f
DEPLOYED-PROJECT: https://tournitup.netlify.app
