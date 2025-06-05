import { Route, Switch } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import VideoPlayer from "@/pages/VideoPlayer";
import Upload from "@/pages/Upload";
import Profile from "@/pages/Profile";
import Search from "@/pages/Search";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import Analytics from "@/pages/Analytics";
import Moderation from "@/pages/Moderation";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/watch/:id" component={VideoPlayer} />
      <ProtectedRoute path="/upload" component={Upload} />
      <ProtectedRoute path="/profile/:id?" component={Profile} />
      <ProtectedRoute path="/analytics/:id?" component={Analytics} />
      <ProtectedRoute path="/moderation" component={Moderation} />
      <Route path="/search" component={Search} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
