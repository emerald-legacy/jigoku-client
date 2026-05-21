import React from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./Login";
import Logout from "./Logout";
import Register from "./Register";
import Lobby from "./Lobby";
import NotFound from "./NotFound";
import PlayRoute from "./PlayRoute";
import NewsRoute from "./NewsRoute";
import UsersRoute from "./UsersRoute";

const Decks = React.lazy(() => import("./Decks"));
const AddDeck = React.lazy(() => import("./AddDeck"));
const EditDeck = React.lazy(() => import("./EditDeck"));
const HowToPlay = React.lazy(() => import("./HowToPlay"));
const About = React.lazy(() => import("./About"));
const Formats = React.lazy(() => import("./Formats"));
const ForgotPassword = React.lazy(() => import("./ForgotPassword"));
const ResetPassword = React.lazy(() => import("./ResetPassword"));
const Profile = React.lazy(() => import("./Profile"));
const Unauthorised = React.lazy(() => import("./Unauthorised"));
const BlockList = React.lazy(() => import("./BlockList"));
const GameReplay = React.lazy(() => import("./GameReplay"));

export default function AppRoutes({ permissions }: { permissions: Record<string, boolean> }) {
    return (
        <Routes>
            <Route path="/" element={ <Lobby /> } />
            <Route path="/login" element={ <Login /> } />
            <Route path="/logout" element={ <Logout /> } />
            <Route path="/register" element={ <Register /> } />
            <Route path="/decks" element={ <Decks /> } />
            <Route path="/decks/add" element={ <AddDeck /> } />
            <Route path="/decks/edit" element={ <EditDeck /> } />
            <Route path="/decks/edit/:deckId" element={ <EditDeck /> } />
            <Route path="/play" element={ <PlayRoute /> } />
            <Route path="/how-to-play" element={ <HowToPlay /> } />
            <Route path="/about" element={ <About /> } />
            <Route path="/formats" element={ <Formats /> } />
            <Route path="/forgot" element={ <ForgotPassword /> } />
            <Route path="/reset-password" element={ <ResetPassword /> } />
            <Route path="/profile" element={ <Profile /> } />
            <Route path="/news" element={ <NewsRoute canEdit={ !!permissions.canEditNews } /> } />
            <Route path="/unauth" element={ <Unauthorised /> } />
            <Route path="/users" element={ <UsersRoute canManage={ !!permissions.canManageUsers } /> } />
            <Route path="/blocklist" element={ <BlockList /> } />
            <Route path="/replay" element={ <GameReplay /> } />
            <Route path="*" element={ <NotFound /> } />
        </Routes>
    );
}
