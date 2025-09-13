import React from "react";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { store } from "./store";
import { AuthProvider } from "./contexts/AuthContext";
import Routes from "./Routes";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider>
            <Routes />
          </AuthProvider>
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  );
}

export default App;