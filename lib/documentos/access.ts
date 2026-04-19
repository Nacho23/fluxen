import { CompanyRole } from "@prisma/client";

/** Datos de política necesarios para comprobar acciones (en cliente o servidor). */
export type DocumentPolicy = {
  uploadedByUserId: string;
  othersCanView: boolean;
  othersCanEdit: boolean;
  othersCanDelete: boolean;
};

export type DocumentViewer = {
  userId: string;
  role: CompanyRole;
};

function isOwner(role: CompanyRole): boolean {
  return role === CompanyRole.OWNER;
}

function isManagement(role: CompanyRole): boolean {
  return role === CompanyRole.OWNER || role === CompanyRole.ADMIN;
}

/** Gerencia puede ver documentos restringidos a “solo autor”. */
export function canViewDocument(viewer: DocumentViewer, doc: DocumentPolicy): boolean {
  if (isOwner(viewer.role)) return true;
  if (doc.othersCanView) return true;
  return doc.uploadedByUserId === viewer.userId || isManagement(viewer.role);
}

/**
 * Editar metadatos (nombre, banderas). La matriz global `documentos:update` sigue aplicando cuando othersCanEdit es true.
 */
export function canEditDocumentMeta(
  viewer: DocumentViewer,
  doc: DocumentPolicy,
  hasMatrixUpdate: boolean,
): boolean {
  if (!canViewDocument(viewer, doc)) return false;
  if (doc.othersCanEdit) {
    return hasMatrixUpdate;
  }
  return doc.uploadedByUserId === viewer.userId || isOwner(viewer.role);
}

/**
 * Eliminar fila + objeto en R2. La matriz `documentos:delete` aplica cuando othersCanDelete es true.
 */
export function canDeleteDocument(
  viewer: DocumentViewer,
  doc: DocumentPolicy,
  hasMatrixDelete: boolean,
): boolean {
  if (!canViewDocument(viewer, doc)) return false;
  if (doc.othersCanDelete) {
    return hasMatrixDelete;
  }
  return doc.uploadedByUserId === viewer.userId || isOwner(viewer.role);
}

/** Política de carpeta (misma idea que documentos: autor + tres banderas). */
export type FolderPolicy = {
  createdByUserId: string;
  othersCanView: boolean;
  othersCanEdit: boolean;
  othersCanDelete: boolean;
};

export function canViewFolder(viewer: DocumentViewer, folder: FolderPolicy): boolean {
  if (isOwner(viewer.role)) return true;
  if (folder.othersCanView) return true;
  return folder.createdByUserId === viewer.userId || isManagement(viewer.role);
}

export function canEditFolderMeta(
  viewer: DocumentViewer,
  folder: FolderPolicy,
  hasMatrixUpdate: boolean,
): boolean {
  if (!canViewFolder(viewer, folder)) return false;
  if (folder.othersCanEdit) {
    return hasMatrixUpdate;
  }
  return folder.createdByUserId === viewer.userId || isOwner(viewer.role);
}

export function canDeleteFolderPolicy(
  viewer: DocumentViewer,
  folder: FolderPolicy,
  hasMatrixDelete: boolean,
): boolean {
  if (!canViewFolder(viewer, folder)) return false;
  if (folder.othersCanDelete) {
    return hasMatrixDelete;
  }
  return folder.createdByUserId === viewer.userId || isOwner(viewer.role);
}

/** Toda la cadena de padres debe ser visible para abrir una carpeta por URL. */
export function canViewFolderPath(
  viewer: DocumentViewer,
  folderId: string | null,
  folders: Array<FolderPolicy & { id: string; parentId: string | null }>,
): boolean {
  if (!folderId) return true;
  const byId = new Map(folders.map((f) => [f.id, f]));
  let cur: string | null = folderId;
  const seen = new Set<string>();
  while (cur) {
    if (seen.has(cur)) return false;
    seen.add(cur);
    const row = byId.get(cur);
    if (!row) return false;
    if (!canViewFolder(viewer, row)) return false;
    cur = row.parentId;
  }
  return true;
}
