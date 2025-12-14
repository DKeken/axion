/**
 * Authorization helpers - Ownership-based access control
 * Simple and type-safe permission checking for resources
 */

/**
 * Resource types
 */
export interface Project {
  id: string;
  userId: string;
  name: string;
}

export interface GraphData {
  projectId: string;
}

export interface Service {
  id: string;
  projectId: string;
}

/**
 * Actions users can perform
 */
export type Actions = "create" | "read" | "update" | "delete" | "manage";

/**
 * Check if user can access a project (ownership-based)
 */
export function canAccessProject(
  userId: string,
  project: { userId: string }
): boolean {
  return project.userId === userId;
}

/**
 * Check if user can update a project (ownership-based)
 */
export function canUpdateProject(
  userId: string,
  project: { userId: string }
): boolean {
  return project.userId === userId;
}

/**
 * Check if user can delete a project (ownership-based)
 */
export function canDeleteProject(
  userId: string,
  project: { userId: string }
): boolean {
  return project.userId === userId;
}

/**
 * Check if user can manage a resource based on project ownership
 * Use this for resources that belong to a project (GraphData, Services, etc.)
 */
export function canManageProjectResource(
  userId: string,
  projectOwnerId: string
): boolean {
  return userId === projectOwnerId;
}
