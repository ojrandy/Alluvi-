/**
 * Janoshik certificates of analysis issued to Alluvi Health Care (manufacturer field:
 * www.alluvihealthcare.co), supplied by the client on 2026-11-26. Images live in
 * public/images/coa/. Keyed by product slug.
 *
 * `url` is the Janoshik verification link for the same task/key. It is still routed through
 * `labLink()` (ADR-020), so it resolves to /contact#certificates until the verification pages
 * are confirmed to show this domain.
 */
export type Certificate = {
  image: string;
  alt: string;
  task: string;
  url: string;
  width: number;
  height: number;
};

const W = 735; // all five are ~730–737 × 1080
const H = 1080;

export const CERTIFICATES: Record<string, Certificate> = {
  "retatrutide-40mg": {
    image: "/images/coa/retatrutide-40mg-239742.jpg",
    alt: "Janoshik test report #239742: Alluvi Retatrutide 40mg kit, batch RT9264BUG",
    task: "239742",
    url: "https://verify.janoshik.com/tests/239742-ALLUVI_RETATRUTIDE_40MG_KIT_EM6LUXF19LHZ",
    width: W,
    height: H,
  },
  "tirzepatide-40mg": {
    image: "/images/coa/tirzepatide-40mg-239744.jpg",
    alt: "Janoshik test report #239744: Alluvi Tirzepatide 40mg kit, batch BT3426LAM",
    task: "239744",
    url: "https://verify.janoshik.com/tests/239744-ALLUVI_TIRZEPATIDE_40MG_KIT_S7637Z45SNLZ",
    width: W,
    height: H,
  },
  "retatrutide-20mg": {
    image: "/images/coa/retatrutide-20mg-239743.jpg",
    alt: "Janoshik test report #239743: Alluvi Retatrutide 20mg kit, batch AR1721TRT",
    task: "239743",
    url: "https://verify.janoshik.com/tests/239743-ALLUVI_RETATRUTIDE_20MG_KIT_1IUIK66E23KN",
    width: W,
    height: H,
  },
  "bpc-157-tb-500-40mg": {
    image: "/images/coa/bpc-157-tb-500-40mg-163218.jpg",
    alt: "Janoshik test report #163218: Alluvi BPC-157 & TB-500 40mg kit, batch BP1701FSR",
    task: "163218",
    url: "https://verify.janoshik.com/tests/163218-ALLUVI_BPC157_TB500_40MG_KIT_EAI125ZEF8TB",
    width: W,
    height: H,
  },
  "glow-70mg": {
    image: "/images/coa/glow-70mg-163217.jpg",
    alt: "Janoshik test report #163217: Alluvi Glow 70mg kit, batch GL0621XSA",
    task: "163217",
    url: "https://verify.janoshik.com/tests/163217-ALLUVI_GLOW_70MG_KIT_DCL3AJSE4JQP",
    width: W,
    height: H,
  },
};

export function certificateFor(slug: string): Certificate | null {
  return CERTIFICATES[slug] ?? null;
}
