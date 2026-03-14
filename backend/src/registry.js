/**
 * In-memory registry of connected CLI daemon machines.
 * In production, replace with a persistent store (Redis, DB, etc.).
 */

import { v4 as uuidv4 } from 'uuid';

const machines = new Map();

export function registerMachine({ name, daemonUrl, daemonId }) {
  const id = daemonId || uuidv4();
  const entry = {
    id,
    name: name || id,
    daemonUrl,
    registeredAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
  };
  machines.set(id, entry);
  return entry;
}

export function getMachine(id) {
  return machines.get(id) || null;
}

export function listMachines() {
  return [...machines.values()];
}

export function touchMachine(id) {
  const m = machines.get(id);
  if (m) {
    m.lastSeen = new Date().toISOString();
    machines.set(id, m);
  }
}

export function removeMachine(id) {
  machines.delete(id);
}
