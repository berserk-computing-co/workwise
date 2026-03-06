// Re-export all fixtures from the web app's canonical mock data.
// This keeps Storybook in sync with the mock API mode automatically.
export {
  mockUser,
  mockOrganization,
  mockProject,
  mockProjectWithSections,
  mockPaginatedProjects,
} from '@/app/mocks/fixtures';
