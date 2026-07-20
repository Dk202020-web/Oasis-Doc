-- ============================================================
-- Oasis-Doc — example seed data for testing
-- Run AFTER 0001_init.sql. Safe to re-run (uses slug/name checks).
-- Structure and example items are inspired by the reference layouts
-- (Documents Judiciaires, GCE A-Level legalisation, translation
-- language pairs, Acte de naissance intake form) — NOT their branding.
-- ============================================================

do $$
declare
  cat_legalisation uuid;
  cat_obtention uuid;
  cat_traduction uuid;
  sec_judiciaires uuid;
  sec_academiques uuid;
  sec_etat_civil uuid;
  sec_langues uuid;
  svc_id uuid;
begin

  -- ---------- Categories ----------
  insert into public.categories (name_fr, name_en, slug, icon, sort_order)
    values ('Légalisation', 'Legalisation', 'legalisation', '⚖️', 0)
    returning id into cat_legalisation;

  insert into public.categories (name_fr, name_en, slug, icon, sort_order)
    values ('Obtention', 'Obtention', 'obtention', '📋', 1)
    returning id into cat_obtention;

  insert into public.categories (name_fr, name_en, slug, icon, sort_order)
    values ('Traduction', 'Translation', 'traduction', '🌐', 2)
    returning id into cat_traduction;

  -- ---------- Sections: Légalisation ----------
  insert into public.service_sections (category_id, name_fr, name_en, sort_order)
    values (cat_legalisation, 'Documents Judiciaires', 'Judicial Documents', 0)
    returning id into sec_judiciaires;

  insert into public.service_sections (category_id, name_fr, name_en, sort_order)
    values (cat_legalisation, 'Diplômes Académiques', 'Academic Diplomas', 1)
    returning id into sec_academiques;

  -- ---------- Services: Documents Judiciaires ----------
  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_judiciaires, 'Déclaration sur l''honneur', 'Sworn Declaration', 'Légalisation d''une déclaration sur l''honneur.', 'Legalisation of a sworn declaration.', 3500);
  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_judiciaires, 'Jugement supplétif', 'Supplementary Judgment', 'Légalisation d''un jugement supplétif.', 'Legalisation of a supplementary judgment.', 3500);
  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_judiciaires, 'Jugement de divorce', 'Divorce Judgment', 'Légalisation d''un jugement de divorce.', 'Legalisation of a divorce judgment.', 3500);
  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_judiciaires, 'Procuration notariée', 'Notarized Power of Attorney', 'Légalisation d''une procuration notariée.', 'Legalisation of a notarized power of attorney.', 3500);
  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_judiciaires, 'Certificat de non-condamnation', 'Certificate of No Conviction', 'Légalisation d''un certificat de non-condamnation.', 'Legalisation of a certificate of no conviction.', 3500);

  -- ---------- Service: Légalisation GCE A-Level (with a PDF/image requirement) ----------
  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_academiques, 'Légalisation GCE A-Level', 'GCE A-Level Legalisation', 'Légalisation officielle d''un diplôme GCE A-Level.', 'Official legalisation of a GCE A-Level diploma.', 3250)
    returning id into svc_id;

  insert into public.service_requirements (service_id, type, label_fr, label_en, help_text, is_required, accepted_formats, max_size_mb, sort_order)
    values (svc_id, 'file_multi', 'Copie du diplôme GCE A-Level', 'Copy of GCE A-Level diploma', 'Format lisible, non endommagé', true, array['pdf','jpg','png'], 5, 0);

  -- ---------- Sections: Obtention ----------
  insert into public.service_sections (category_id, name_fr, name_en, sort_order)
    values (cat_obtention, 'Actes d''État Civil', 'Civil Status Records', 0)
    returning id into sec_etat_civil;

  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_etat_civil, 'Acte de naissance', 'Birth Certificate', 'Obtention d''une copie d''acte de naissance.', 'Obtaining a copy of a birth certificate.', 6500)
    returning id into svc_id;

  insert into public.service_requirements (service_id, type, label_fr, label_en, help_text, is_required, accepted_formats, max_size_mb, sort_order)
    values
      (svc_id, 'short_text', 'Nom complet', 'Full name', 'Le nom exact tel qu''il apparaît sur le document', true, null, null, 0),
      (svc_id, 'date', 'Date de naissance', 'Date of birth', 'Pour vérifier la cohérence avec le document', true, null, null, 1),
      (svc_id, 'short_text', 'Département de naissance', 'Department of birth', null, true, null, null, 2),
      (svc_id, 'short_text', 'Motif de la demande', 'Reason for request', null, true, null, null, 3),
      (svc_id, 'file_image', 'Copie CNI', 'ID card copy', 'Format lisible, non endommagé (Facultatif)', false, array['pdf','jpg','png'], 2, 4),
      (svc_id, 'file_pdf', 'Acte de naissance du demandeur', 'Applicant''s birth certificate', 'Format lisible, non endommagé (Facultatif)', false, array['pdf','jpg','png'], 5, 5),
      (svc_id, 'long_text', 'Notes ou instructions spéciales', 'Notes or special instructions', null, false, null, null, 6);

  -- ---------- Sections: Traduction ----------
  insert into public.service_sections (category_id, name_fr, name_en, sort_order)
    values (cat_traduction, 'Langues Disponibles', 'Available Languages', 0)
    returning id into sec_langues;

  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_langues, 'Traduction Français → Anglais', 'Translation French → English', 'Traduction certifiée, prix par page (A4).', 'Certified translation, price per page (A4).', 16000)
    returning id into svc_id;
  insert into public.service_requirements (service_id, type, label_fr, label_en, help_text, is_required, accepted_formats, max_size_mb, sort_order)
    values (svc_id, 'file_multi', 'Document(s) à traduire', 'Document(s) to translate', 'Format lisible, non endommagé', true, array['pdf','jpg','png'], 10, 0);

  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_langues, 'Traduction Anglais → Français', 'Translation English → French', 'Traduction certifiée, prix par page (A4).', 'Certified translation, price per page (A4).', 16000)
    returning id into svc_id;
  insert into public.service_requirements (service_id, type, label_fr, label_en, help_text, is_required, accepted_formats, max_size_mb, sort_order)
    values (svc_id, 'file_multi', 'Document(s) à traduire', 'Document(s) to translate', 'Format lisible, non endommagé', true, array['pdf','jpg','png'], 10, 0);

  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_langues, 'Traduction de diplôme', 'Diploma Translation', 'Traduction certifiée d''un diplôme.', 'Certified translation of a diploma.', 10000);

  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_langues, 'Traduction du Registre de commerce', 'Trade Register Translation', 'Traduction certifiée du registre de commerce.', 'Certified translation of the trade register.', 15000);

  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_langues, 'Traduction du Crédit Immobilier', 'Mortgage Deed Translation', 'Traduction certifiée d''un acte de crédit immobilier.', 'Certified translation of a mortgage deed.', 15000);

  insert into public.services (section_id, name_fr, name_en, description_fr, description_en, price_xaf)
    values (sec_langues, 'Traduction — Ministère des Relations Extérieures', 'Ministry of External Relations Translation', 'Traduction certifiée pour dépôt au MINREX.', 'Certified translation for MINREX filing.', 30000);

end $$;
