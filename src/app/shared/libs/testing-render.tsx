import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {render} from "@testing-library/react";

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

export const customRender = (ui: React.ReactElement, options = {}) => {
  const queryClient = createTestQueryClient();
  return render(ui, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    ...options,
  });
};

export const clearQueryClient = () => {
  const queryClient = createTestQueryClient();
  queryClient.clear();
};
