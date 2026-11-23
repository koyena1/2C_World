import { EXIT_DOC_TYPES, type ExitCase } from '../../../data/mockExitData';
import { logAudit } from '../../hr-ops/auditStore';
import type { DocumentSizeRule } from '../../../data/mockDocumentRulesData';
import { setExitDoc } from './exitStore';
import { checkFile } from './ExitUi';

export const docLabel = (id: string): string => EXIT_DOC_TYPES.find((d) => d.id === id)?.label ?? id;

/** Simulated upload: enforces the "experience" document size/format rule, then records file name, size, who/when. */
export const uploadExitDoc = (
  ec: ExitCase,
  docId: string,
  file: { name: string; size: number },
  rule: DocumentSizeRule | undefined,
  actor: { id: string; name: string },
  existingVersion = 0
): string | null => {
  const err = rule ? checkFile(file.name, file.size, rule.formats, rule.maxMb) : null;
  if (err) return err;
  setExitDoc(ec.id, docId, { fileName: file.name, sizeKb: file.size / 1024, by: actor.name, at: new Date().toISOString(), version: existingVersion + 1 });
  logAudit({
    area: 'exit-documentation',
    action: `${existingVersion ? 'Replaced' : 'Uploaded'} ${docLabel(docId)} for ${ec.employee} (${file.name})`,
    subjectId: ec.id,
    actorId: actor.id,
    actorName: actor.name,
  });
  return null;
};
