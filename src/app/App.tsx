import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import Container from "@mui/material/Container";
import {Header} from "./components/header";
import {Statistic} from "./pages/Statistic";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      
      <Container maxWidth="xl">
        <Statistic />
      </Container>
    </QueryClientProvider>
  )
}