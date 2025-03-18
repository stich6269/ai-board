import {describe, it, expect, afterEach, vi, beforeEach} from "vitest";
import {screen} from "@testing-library/react";
import {Overview} from "./Overview.tsx";
import {clearQueryClient, customRender} from "@libs/testing-render.tsx";
import {useQuery} from "@tanstack/react-query";
import '@testing-library/jest-dom/vitest'


vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query');
  return {...actual, useQuery: vi.fn(),};
});

vi.mock('@helpers/count-duration', () => ({
  countDuration: vi.fn().mockReturnValue(5), // Mock duration as 5 hours
}));

vi.mock('@helpers/ai-issues-stat', () => ({
  aiIssuesStat: vi.fn().mockReturnValue({
    aiUsageDuration: 2, // Mock 2 hours
    aiBoostPercentage: 15, // Mock 15%
  }),
}));

const issueMoc = { data: new Array(65), isLoading: false } as any;
const engineersMoc = { data: new Array(10), isLoading: false } as any;


describe("Overview", () => {
  afterEach(() => {
    clearQueryClient();
    vi.clearAllMocks();
  });
  
  beforeEach(() => {
    vi.mocked(useQuery).mockReturnValueOnce(issueMoc);
    vi.mocked(useQuery).mockReturnValueOnce(engineersMoc);
  });
  
  
  it('Should render values', () => {
    customRender(<Overview />)
    
    const issuesBlock = screen.getByTestId('issues-block');
    expect(issuesBlock).toBeInTheDocument();
    expect(issuesBlock).toHaveTextContent('Issues closed');
    expect(issuesBlock).toHaveTextContent(issueMoc.data.length.toString()); // mockIssuesData.length
    
    // Test Engineers block
    const engineersBlock = screen.getByTestId('engineers-block');
    expect(engineersBlock).toBeInTheDocument();
    expect(engineersBlock).toHaveTextContent('Engineers');
    expect(engineersBlock).toHaveTextContent(engineersMoc.data.length.toString()); // mockEngineersData.length
    
    // Test Working Time block
    const workingTimeBlock = screen.getByTestId('working-time-block');
    expect(workingTimeBlock).toBeInTheDocument();
    expect(workingTimeBlock).toHaveTextContent('Working time');
    expect(workingTimeBlock).toHaveTextContent('5h'); // mocked countDuration
    
    // Test AI Used block
    const aiUsedBlock = screen.getByTestId('ai-used-block');
    expect(aiUsedBlock).toBeInTheDocument();
    expect(aiUsedBlock).toHaveTextContent('Ai used');
    expect(aiUsedBlock).toHaveTextContent('2 h'); // mocked aiUsageDuration
    
    // Test AI Usage Boost block
    const aiUsageBoostBlock = screen.getByTestId('ai-boost-block');
    expect(aiUsageBoostBlock).toBeInTheDocument();
    expect(aiUsageBoostBlock).toHaveTextContent('AI usage boost');
    expect(aiUsageBoostBlock).toHaveTextContent('15%'); // mocked aiBoostPercentage
  })
})