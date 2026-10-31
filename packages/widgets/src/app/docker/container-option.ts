export interface LinkedDockerContainer {
  endpointId: string;
  name: string;
}

// Container names cannot contain "@" but endpoint ids can, so the name goes first. The name survives recreating a
// container on update, the id does not.
const separator = "@";

export const formatLinkedDockerContainer = ({ endpointId, name }: LinkedDockerContainer) =>
  `${name}${separator}${endpointId}`;

export const parseLinkedDockerContainer = (value: string): LinkedDockerContainer | null => {
  const separatorIndex = value.indexOf(separator);
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) return null;
  return { name: value.slice(0, separatorIndex), endpointId: value.slice(separatorIndex + 1) };
};
