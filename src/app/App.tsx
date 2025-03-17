import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import Container from "@mui/material/Container";
import {Header} from "./components/header";
import {Statistic} from "./pages/Statistic";
import {ReactQueryDevtools} from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

export const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      
      <Container maxWidth="xl">
        <Statistic />
      </Container>
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}