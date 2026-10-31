import { describe, expect, test } from "vitest";

import { formatLinkedDockerContainer, parseLinkedDockerContainer, suggestDockerContainer } from "./container-option";

describe("linked docker container option", () => {
  test.each([
    { endpointId: "socket:/var/run/docker.sock", name: "sonarr" },
    { endpointId: "tcp:192.168.1.10:2375", name: "my_app.v2-1" },
    { endpointId: "remote@office", name: "plex" },
  ])("round-trips $name on $endpointId", (container) => {
    expect(parseLinkedDockerContainer(formatLinkedDockerContainer(container))).toEqual(container);
  });

  test.each(["", "sonarr", "@socket:/var/run/docker.sock", "sonarr@"])("rejects %j", (value) => {
    expect(parseLinkedDockerContainer(value)).toBeNull();
  });
});

const app = (name: string, href: string | null = null, pingUrl: string | null = null) => ({ name, href, pingUrl });

describe("docker container suggestion", () => {
  const containers = [
    { name: "sonarr", ports: [{ PublicPort: 8989 }] },
    { name: "radarr", ports: [{ PublicPort: 7878 }] },
    { name: "Home-Assistant" },
    { name: "jellyfin", ports: [{ PublicPort: 8096 }] },
  ];

  test("matches the app name regardless of case and separators", () => {
    expect(suggestDockerContainer(app("Home Assistant"), containers)?.name).toBe("Home-Assistant");
  });

  test("matches the subdomain of an app behind a reverse proxy", () => {
    expect(suggestDockerContainer(app("TV", "https://sonarr.example.com"), containers)?.name).toBe("sonarr");
  });

  test("matches a published port in the ping url", () => {
    expect(suggestDockerContainer(app("Movies", null, "http://192.168.1.10:7878"), containers)?.name).toBe("radarr");
  });

  test("prefers the name over a port of another container", () => {
    expect(suggestDockerContainer(app("Jellyfin", "http://192.168.1.10:8989"), containers)?.name).toBe("jellyfin");
  });

  test("suggests nothing when two containers match equally", () => {
    expect(
      suggestDockerContainer(app("Media", "http://nas:8096"), [
        ...containers,
        { name: "emby", ports: [{ PublicPort: 8096 }] },
      ]),
    ).toBeNull();
  });

  test("suggests nothing without a hint", () => {
    expect(suggestDockerContainer(app("Notes", "not a url"), containers)).toBeNull();
  });
});
