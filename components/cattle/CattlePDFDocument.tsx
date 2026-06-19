import {
  Document, Page, Text, View, StyleSheet, pdf, Image,
} from "@react-pdf/renderer"
import type { Cattle, FarmSettings } from "@/types"
import { formatDate, getAgeInYears, getAgeInMonths } from "@/lib/utils"

const ACCENT = "#1f472f"
const GOLD = "#9a7b2f"
const GOLD_SOFT = "#d8c79a"
// Match the on-screen FamilyTree palette (blue-400 / pink-400)
const SIRE_BAR = "#60a5fa"
const DAM_BAR = "#f472b6"

const styles = StyleSheet.create({
  page: { paddingVertical: 26, paddingHorizontal: 26, fontFamily: "Times-Roman", fontSize: 10, color: "#1a1a1a", position: "relative" },

  // Decorative double frame
  frameOuter: { position: "absolute", top: 16, left: 16, right: 16, bottom: 16, border: `2.5pt solid ${ACCENT}` },
  frameInner: { position: "absolute", top: 22, left: 22, right: 22, bottom: 22, border: `0.75pt solid ${GOLD}` },

  content: { paddingTop: 16, paddingHorizontal: 30 },

  // Farm header
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  logo: { width: 52, height: 52, objectFit: "cover", borderRadius: 26, marginRight: 12 },
  farmBlock: { alignItems: "center" },
  farmName: { fontSize: 17, fontFamily: "Times-Bold", color: ACCENT, letterSpacing: 0.5 },
  farmDetails: { fontSize: 8.5, fontFamily: "Times-Roman", color: "#666", marginTop: 2, textAlign: "center" },

  // Title block
  titleWrap: { alignItems: "center", marginTop: 12, marginBottom: 10 },
  certificateTitle: { fontSize: 25, fontFamily: "Times-Bold", textAlign: "center", color: ACCENT, textTransform: "uppercase", letterSpacing: 3 },
  titleRuleRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 7 },
  titleRule: { width: 110, height: 0.75, backgroundColor: GOLD },
  diamond: { width: 5, height: 5, backgroundColor: GOLD, marginHorizontal: 6 },

  // Intro statement
  intro: { fontSize: 11, fontFamily: "Times-Italic", textAlign: "center", color: "#333", lineHeight: 1.7, marginHorizontal: 16, marginBottom: 4 },
  introStrong: { fontFamily: "Times-Bold", color: ACCENT },

  ownerBlock: { width: "100%", alignItems: "center", paddingTop: 15 },
  ownerLine: {  textAlign: "center", width: "235", borderTop: "1pt solid #333", paddingTop: 5 },
  ownerCaption: { textAlign: "center", fontSize: 8.5, fontFamily: "Times-Italic", color: "#888", marginTop: 3, marginBottom: 14 },

  // Details panel
  detailsPanel: { borderTop: `0.75pt solid ${GOLD_SOFT}`, borderBottom: `0.75pt solid ${GOLD_SOFT}`, paddingVertical: 10, marginBottom: 16 },
  detailsGrid: { flexDirection: "row", flexWrap: "wrap" },
  detailCell: { width: "50%", flexDirection: "row", paddingVertical: 4, paddingHorizontal: 12 },
  detailLabel: { width: 70, fontFamily: "Times-Roman", color: "#666", fontSize: 10 },
  detailValue: { flex: 1, fontFamily: "Times-Bold", fontSize: 11 },

  // Sections
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Times-Bold", color: ACCENT, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 10 },

  // Family tree
  treeNodeWrap: { flexDirection: "column", alignItems: "center", marginHorizontal: 8 },
  treeNode: { position: "relative", overflow: "hidden", border: "0.75pt solid #c9b98a", borderRadius: 6, paddingHorizontal: 6, paddingTop: 4, width: 92, height: 56, minHeight: 56, maxHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: "#fcfbf7" },
  treeNodeRoot: { position: "relative", overflow: "hidden", border: `1.5pt solid ${ACCENT}`, borderRadius: 6, paddingHorizontal: 6, paddingTop: 4, width: 92, height: 56, minHeight: 56, maxHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f7f4" },
  treeNodeDashed: { position: "relative", overflow: "hidden", border: "0.75pt dashed #c9b98a", borderRadius: 6, paddingHorizontal: 6, paddingTop: 4, width: 92, height: 56, minHeight: 56, maxHeight: 56, alignItems: "center", justifyContent: "center", backgroundColor: "#faf9f5" },
  sexBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  treeNodeTag: { fontFamily: "Times-Bold", fontSize: 9, color: "#1a1a1a" },
  treeNodeSub: { fontSize: 7, fontFamily: "Times-Italic", color: "#888", marginTop: 1 },
  // Sex pill badge (mirrors on-screen tree)
  nodeBadge: { marginTop: 3, borderRadius: 7, paddingVertical: 1, paddingHorizontal: 5 },
  nodeBadgeMale: { backgroundColor: "#dbeafe" },
  nodeBadgeFemale: { backgroundColor: "#fce7f3" },
  nodeBadgeTextMale: { fontSize: 6.5, fontFamily: "Times-Bold", color: "#1d4ed8" },
  nodeBadgeTextFemale: { fontSize: 6.5, fontFamily: "Times-Bold", color: "#be185d" },
  treeLabel: { fontSize: 8, fontFamily: "Times-Roman", color: "#666", marginBottom: 3 },
  treeLabelBelow: { fontSize: 7.5, fontFamily: "Times-Bold", color: ACCENT, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 4 },
  connector: { width: 1, height: 12, backgroundColor: "#c9b98a", alignSelf: "center" },

  // Footer
  footer: { position: "absolute", bottom: 38, left: 56, right: 56 },
  legalText: { fontSize: 8.5, fontFamily: "Times-Italic", color: "#555", lineHeight: 1.5, textAlign: "center", marginBottom: 18 },
  footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sigBlock: { width: 210 },
  sigLine: { borderTop: "1pt solid #333", paddingTop: 5 },
  sigName: { fontSize: 10.5, fontFamily: "Times-Bold" },
  sigRole: { fontSize: 8.5, fontFamily: "Times-Italic", color: "#888", marginTop: 2 },
})

function lookupCattle(tag: string | undefined, allCattle: Cattle[]): Cattle | undefined {
  if (!tag) return undefined
  return allCattle.find((c) => c.tagNumber === tag)
}

function PdfNode({ cattle, tag, root }: { cattle?: Cattle; tag?: string; root?: boolean }) {
  if (!cattle) {
    return (
      <View style={styles.treeNodeDashed}>
        <Text style={styles.treeNodeTag}>{tag || "—"}</Text>
        <Text style={styles.treeNodeSub}>Not in record</Text>
      </View>
    )
  }
  const male = cattle.sex === "male"
  return (
    <View style={root ? styles.treeNodeRoot : styles.treeNode}>
      <View style={[styles.sexBar, { backgroundColor: male ? SIRE_BAR : DAM_BAR }]} />
      <Text style={styles.treeNodeTag}>{cattle.tagNumber}</Text>
      {cattle.nickname ? <Text style={styles.treeNodeSub} wrap={false}>{cattle.nickname}</Text> : null}
      <Text style={styles.treeNodeSub} wrap={false}>{formatDate(cattle.dateOfBirth)}</Text>
      <View style={[styles.nodeBadge, male ? styles.nodeBadgeMale : styles.nodeBadgeFemale]}>
        <Text style={male ? styles.nodeBadgeTextMale : styles.nodeBadgeTextFemale} wrap={false}>
          {male ? "Bull" : "Cow"}
        </Text>
      </View>
    </View>
  )
}

/** Clean bracket: short drops from each parent, a joining bar, and a center stem to the child. */
function PedigreeConnector({ width, leftCenter, rightCenter, height = 12 }: {
  width: number
  leftCenter: number
  rightCenter: number
  height?: number
}) {
  const mid = (leftCenter + rightCenter) / 2
  const half = height / 2
  const line = "#c9b98a"
  const t = 0.75
  return (
    <View style={{ width, height, position: "relative" }}>
      {/* drop from left parent */}
      <View style={{ position: "absolute", left: leftCenter, top: 0, width: t, height: half, backgroundColor: line }} />
      {/* drop from right parent */}
      <View style={{ position: "absolute", left: rightCenter, top: 0, width: t, height: half, backgroundColor: line }} />
      {/* horizontal joining bar */}
      <View style={{ position: "absolute", left: leftCenter, top: half, width: rightCenter - leftCenter + t, height: t, backgroundColor: line }} />
      {/* stem down to child */}
      <View style={{ position: "absolute", left: mid, top: half, width: t, height: half, backgroundColor: line }} />
    </View>
  )
}

/** A parent side of the pedigree: two grandparents bracketed down to one parent. */
function PedigreeBlock({
  grandsire, grandsireTag, granddam, granddamTag, parent, parentTag, label,
}: {
  grandsire?: Cattle
  grandsireTag?: string
  granddam?: Cattle
  granddamTag?: string
  parent?: Cattle
  parentTag?: string
  label: string
}) {
  return (
    <View style={{ width: 192, alignItems: "center" }}>
      {/* Grandparents */}
      <View style={{ flexDirection: "row", justifyContent: "center" }}>
        <PdfNode cattle={grandsire} tag={grandsireTag} />
        <View style={{ width: 8 }} />
        <PdfNode cattle={granddam} tag={granddamTag} />
      </View>
      {/* Bracket joining the pair down to the parent (grandparent centers at 46 and 146) */}
      <PedigreeConnector width={192} leftCenter={46} rightCenter={146} />
      {/* Parent */}
      <PdfNode cattle={parent} tag={parentTag} />
      <Text style={styles.treeLabelBelow}>{label}</Text>
    </View>
  )
}

function CattlePDFDocument({ cattle, allCattle, settings }: {
  cattle: Cattle
  allCattle: Cattle[]
  settings: FarmSettings
}) {
  const sire = lookupCattle(cattle.sireTagNumber, allCattle)
  const dam = lookupCattle(cattle.damTagNumber, allCattle)
  const grandsire_s = lookupCattle(sire?.sireTagNumber, allCattle)
  const granddam_s = lookupCattle(sire?.damTagNumber, allCattle)
  const grandsire_d = lookupCattle(dam?.sireTagNumber, allCattle)
  const granddam_d = lookupCattle(dam?.damTagNumber, allCattle)

  const ageMonths = getAgeInMonths(cattle.dateOfBirth)
  const ageLabel = ageMonths < 12 ? `${ageMonths} months` : `${getAgeInYears(cattle.dateOfBirth)} years`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Decorative double frame */}
        <View style={styles.frameOuter} fixed />
        <View style={styles.frameInner} fixed />

        <View style={styles.content}>
          {/* Farm header */}
          <View style={styles.headerRow}>
            {settings.logoPath ? (
              // react-pdf Image renders to PDF, not the DOM, and its type has no alt prop
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image
                src={`/api/images/${settings.logoPath.split("/").pop()}`}
                style={styles.logo}
              />
            ) : null}
            <View style={styles.farmBlock}>
              <Text style={styles.farmName}>{settings.farmName || "Cattle Farm"}</Text>
              {settings.address ? <Text style={styles.farmDetails}>{settings.address}</Text> : null}
              {settings.phone || settings.email ? (
                <Text style={styles.farmDetails}>{[settings.phone, settings.email].filter(Boolean).join("   ·   ")}</Text>
              ) : null}
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleWrap}>
            <Text style={styles.certificateTitle}>Certificate of Ownership</Text>
            <View style={styles.titleRuleRow}>
              <View style={styles.titleRule} />
              <View style={styles.diamond} />
              <View style={styles.titleRule} />
            </View>
          </View>

          {/* Certifying statement */}
          <Text style={styles.intro}>
            <Text>This is to certify that the animal described below was bred and produced by </Text>
            <Text style={styles.introStrong}>{settings.farmName || "Cattle Farm"}</Text>
            <Text>, and is presently owned by</Text>
          </Text>

          <View style={styles.ownerBlock}>
            <View style={styles.ownerLine}></View>
            <Text style={styles.ownerCaption}>(Name of Owner)</Text>
          </View>

          {/* Animal details */}
          <View style={styles.detailsPanel}>
            <View style={styles.detailsGrid}>
              {[
                ["Tag No.", cattle.tagNumber],
                ["Nickname", cattle.nickname || "—"],
                ["Breed", cattle.breed || "—"],
                ["Sex", cattle.sex === "male" ? "Male" : "Female"],
                ["Born", formatDate(cattle.dateOfBirth)],
                ["Age", ageLabel],
                ["Sire", cattle.sireTagNumber || "—"],
                ["Dam", cattle.damTagNumber || "—"],
              ].map(([label, value]) => (
                <View key={String(label)} style={styles.detailCell}>
                  <Text style={styles.detailLabel}>{label}</Text>
                  <Text style={styles.detailValue}>{value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pedigree / Family Tree */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pedigree</Text>

            {/* Two parent lines, each bracketing its grandparents */}
            <View style={{ flexDirection: "row", justifyContent: "center" }}>
              <PedigreeBlock
                grandsire={grandsire_s} grandsireTag={sire?.sireTagNumber}
                granddam={granddam_s} granddamTag={sire?.damTagNumber}
                parent={sire} parentTag={cattle.sireTagNumber}
                label="Sire"
              />
              <View style={{ width: 24 }} />
              <PedigreeBlock
                grandsire={grandsire_d} grandsireTag={dam?.sireTagNumber}
                granddam={granddam_d} granddamTag={dam?.damTagNumber}
                parent={dam} parentTag={cattle.damTagNumber}
                label="Dam"
              />
            </View>

            {/* Bracket joining the two parents down to the subject (parent centers at 96 and 312) */}
            <View style={{ alignSelf: "center" }}>
              <PedigreeConnector width={408} leftCenter={96} rightCenter={312} />
            </View>

            {/* Subject */}
            <View style={{ alignItems: "center" }}>
              <PdfNode cattle={cattle} root />
              <Text style={styles.treeLabelBelow}>Subject</Text>
            </View>
          </View>
        </View>

        {/* Footer: legal note, signature, seal */}
        <View style={styles.footer} fixed>
          <Text style={styles.legalText}>
            This certificate is issued for whatever legal purpose it may serve.{"  "}
            Given this {formatDate(new Date().toISOString().slice(0, 10))}.
          </Text>
          <View style={styles.footerRow}>
            <View style={styles.sigBlock}>
              <View style={styles.sigLine}>
                <Text style={styles.sigName}>{settings.ownerName || "Owner"}</Text>
              </View>
              <Text style={styles.sigRole}>Farm Owner{settings.farmName ? ` — ${settings.farmName}` : ""}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export async function generateCattlePDF(
  cattle: Cattle,
  allCattle: Cattle[],
  settings: FarmSettings
): Promise<void> {
  const blob = await pdf(
    <CattlePDFDocument cattle={cattle} allCattle={allCattle} settings={settings} />
  ).toBlob()

  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `cattle-${cattle.tagNumber}-${new Date().toISOString().slice(0, 10)}.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
