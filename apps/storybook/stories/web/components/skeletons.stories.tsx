import type { Meta, StoryObj } from "@storybook/react";
import {
  Skeleton,
  ProjectCardSkeleton,
  ProjectsListSkeleton,
  ProjectDetailSkeleton,
} from "@/app/components/skeletons";

const meta = {
  title: "web/Components/Skeletons",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Base: Story = {
  render: () => (
    <div className="space-y-2 max-w-md">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
};

export const ProjectCard: Story = {
  render: () => (
    <div className="max-w-sm">
      <ProjectCardSkeleton />
    </div>
  ),
};

export const ProjectsList: Story = {
  render: () => <ProjectsListSkeleton />,
};

export const ProjectDetail: Story = {
  render: () => (
    <div className="max-w-3xl">
      <ProjectDetailSkeleton />
    </div>
  ),
};

export const DarkMode: Story = {
  decorators: [
    (Story) => (
      <div className="dark bg-[#0f0f12] p-6 rounded-xl">
        <Story />
      </div>
    ),
  ],
  render: () => <ProjectsListSkeleton />,
};
