import { useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppProvider, useApp } from "./ui/AppContext";
import { setupChrome } from "./native/statusBar";
import { OnboardingView } from "./ui/views/OnboardingView";
import { HomeView } from "./ui/views/HomeView";
import { DealEditorView } from "./ui/views/DealEditorView";
import { PreflightView } from "./ui/views/PreflightView";
import { LiveView } from "./ui/views/LiveView";
import { MemoView } from "./ui/views/MemoView";
import { SessionsView } from "./ui/views/SessionsView";
import { SettingsView } from "./ui/views/SettingsView";
import { PaywallView } from "./ui/views/PaywallView";
import { LegalView } from "./ui/views/LegalView";

function Gate({ children }: { children: JSX.Element }) {
  const { ready, settings } = useApp();
  const loc = useLocation();
  if (!ready) return <div className="h-full flex items-center justify-center text-ink-400 text-xs tracking-widest uppercase">Deal Guard</div>;
  if (!settings.onboardingDone && !loc.pathname.startsWith("/onboarding") && !loc.pathname.startsWith("/legal")) return <Navigate to="/onboarding" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  useEffect(() => {
    void setupChrome();
  }, []);
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <Gate>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/onboarding" element={<OnboardingView />} />
            <Route path="/home" element={<HomeView />} />
            <Route path="/deal/:id" element={<DealEditorView />} />
            <Route path="/preflight/:id" element={<PreflightView />} />
            <Route path="/live/:id" element={<LiveView />} />
            <Route path="/memo/:sessionId" element={<MemoView />} />
            <Route path="/sessions" element={<SessionsView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route path="/paywall" element={<PaywallView />} />
            <Route path="/legal/:doc" element={<LegalView />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </Gate>
      </HashRouter>
    </AppProvider>
  );
}
