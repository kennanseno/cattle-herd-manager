import {
  Document, Page, Text, View, StyleSheet, pdf, Image,
} from "@react-pdf/renderer"
import type { Cattle, FarmSettings } from "@/types"
import { formatDate, getAgeInYears, getAgeInMonths } from "@/lib/utils"

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1a1a1a" },
  header: { borderBottom: "2pt solid #16a34a", paddingBottom: 12, marginBottom: 16 },
  farmName: { fontSize: 18, fontFamily: "Helvetica-Bold", color: "#14532d" },
  farmDetails: { fontSize: 9, color: "#555", marginTop: 2 },
  title: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#555" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#14532d", borderBottom: "1pt solid #e5e7eb", paddingBottom: 3, marginBottom: 8 },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 150, color: "#555" },
  value: { flex: 1, fontFamily: "Helvetica-Bold" },
  // Family tree
  treeRow: { flexDirection: "row", justifyContent: "center", marginBottom: 10 },
  treeNodeWrap: { flexDirection: "column", alignItems: "center", marginHorizontal: 8 },
  treeNode: { border: "1pt solid #d1d5db", borderRadius: 4, padding: "4 8", width: 90, alignItems: "center" },
  treeNodeRoot: { border: "2pt solid #16a34a", borderRadius: 4, padding: "4 8", width: 90, alignItems: "center", backgroundColor: "#f0fdf4" },
  treeNodeTag: { fontFamily: "Helvetica-Bold", fontSize: 9 },
  treeNodeSub: { fontSize: 7, color: "#888", marginTop: 1 },
  treeLabel: { fontSize: 8, color: "#555", marginBottom: 3 },
  connector: { width: 1, height: 12, backgroundColor: "#d1d5db", alignSelf: "center" },
  // Footer
  footer: { position: "absolute", bottom: 40, left: 40, right: 40 },
  footerLine: { paddingTop: 8 },
  footerSig: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  sigLine: { width: 200, borderTop: "1pt solid #333", paddingTop: 4, fontSize: 9 },
  certificateTitle: { fontSize: 26, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 6, color: "#0b3b2e", textTransform: "uppercase", letterSpacing: 1 },
  certificateSubtitle: { fontSize: 11, textAlign: "left", color: "#2c5f49", marginBottom: 10, lineHeight: "200%" },
  certContent: { padding: 28, zIndex: 1, backgroundColor: "#ffffff" },
  certLabel: { fontSize: 11, color: "#444", width: 140 },
  certValue: { fontSize: 12, fontFamily: "Helvetica-Bold", flex: 1 },
  logo: { width: 72, height: 72, objectFit: 'cover', borderRadius: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
})

function lookupCattle(tag: string | undefined, allCattle: Cattle[]): Cattle | undefined {
  if (!tag) return undefined
  return allCattle.find((c) => c.tagNumber === tag)
}

function ageStr(dob: string) {
  const months = getAgeInMonths(dob)
  if (months < 12) return `${months} months`
  return `${getAgeInYears(dob)} years`
}

function TreeNodePDF({ cattle, tag, label }: { cattle: Cattle | undefined; tag?: string; label?: string }) {
  if (!cattle) return (
    <View style={styles.treeNodeWrap}>
      {label && <Text style={styles.treeLabel}>{label}</Text>}
      <View style={[styles.treeNode, { borderStyle: "dashed" }]}>
        {tag ? <Text style={styles.treeNodeTag}>{tag}</Text> : <Text style={styles.treeNodeSub}>Unknown</Text>}
        {tag && <Text style={styles.treeNodeSub}>Not in record</Text>}
      </View>
    </View>
  )
  return (
    <View style={styles.treeNodeWrap}>
      {label && <Text style={styles.treeLabel}>{label}</Text>}
      <View style={styles.treeNode}>
        <Text style={styles.treeNodeTag}>{cattle.tagNumber}</Text>
        {cattle.nickname ? <Text style={styles.treeNodeSub}>{cattle.nickname}</Text> : null}
        <Text style={styles.treeNodeSub}>{formatDate(cattle.dateOfBirth)}</Text>
        <Text style={styles.treeNodeSub}>{cattle.sex === "male" ? "Bull (M)" : "Cow (F)"}</Text>
      </View>
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
        {/* Certificate (styled box) */}
        {/* Farm Header */}
        <View style={[styles.header, styles.headerRow]}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {settings.logoPath ? (
              <Image
                src={`/api/images/${settings.logoPath.split('/').pop()}`}
                style={styles.logo}
              />
            ) : null}
            <View style={{ marginLeft: settings.logoPath ? 10 : 0 }}>
              <Text style={styles.farmName}>{settings.farmName || "Cattle Farm"}</Text>
              {settings.address ? <Text style={styles.farmDetails}>{settings.address}</Text> : null}
              {settings.phone || settings.email ? (
                <Text style={styles.farmDetails}> {[settings.phone, settings.email].filter(Boolean).join(" · ")} </Text>
                ) : null}
            </View>
          </View>

        </View>

        {/* Certificate Header */}
        <View style={styles.certContent}>
          <Text style={styles.certificateTitle}>Certificate of Ownership</Text>
          <Text style={styles.certificateSubtitle}>{"This certifies that the following animal is produced by " + settings.farmName + " and is presently owned by   _________________________________."}</Text>

          {/* <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 9, fontStyle: "italic", color: "#333" }}>{"This certificate is issued for whatever legal porpuse it may serve."}</Text>
            <Text style={{ fontSize: 9, fontStyle: "italic", color: "#333" }}>{ "Given on this day, " + formatDate(new Date().toISOString().slice(0, 10)) + "." }</Text>
          </View> */}

          {/* Basic Info laid out like a certificate */}
          <View style={{ marginBottom: 12 }}>
            {[
              ["Tag Number", cattle.tagNumber],
              ["Nickname", cattle.nickname || "—"],
              ["Breed", cattle.breed || "—"],
              ["Sex", cattle.sex === "male" ? "Male" : "Female"],
              ["Date of Birth", formatDate(cattle.dateOfBirth)],
              ["Age", ageLabel],
              ["Sire", cattle.sireTagNumber || "—"],
              ["Dam", cattle.damTagNumber || "—"],
            ].map(([label, value]) => (
              <View key={String(label)} style={{ flexDirection: "row", marginBottom: 6 }}>
                <Text style={styles.certLabel}>{label}</Text>
                <Text style={styles.certValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Ownership signature moved to footer */}
        </View>

        {/* Pedigree / Family Tree */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pedigree (up to Grandparents)</Text>

          {/* Grandparent row */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 4 }}>
            <TreeNodePDF cattle={grandsire_s} tag={sire?.sireTagNumber} label="Paternal Grandsire" />
            <TreeNodePDF cattle={granddam_s} tag={sire?.damTagNumber} label="Paternal Granddam" />
            <View style={{ width: 16 }} />
            <TreeNodePDF cattle={grandsire_d} tag={dam?.sireTagNumber} label="Maternal Grandsire" />
            <TreeNodePDF cattle={granddam_d} tag={dam?.damTagNumber} label="Maternal Granddam" />
          </View>

          {/* Connector */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 4 }}>
            <View style={{ width: 89, borderBottom: "1pt solid #d1d5db", marginHorizontal: 8 }} />
            <View style={{ width: 16 }} />
            <View style={{ width: 89, borderBottom: "1pt solid #d1d5db", marginHorizontal: 8 }} />
          </View>

          {/* Parents */}
          <View style={{ flexDirection: "row", justifyContent: "center", marginBottom: 4 }}>
            <TreeNodePDF cattle={sire} tag={cattle.sireTagNumber} label="Sire" />
            <View style={{ width: 32 }} />
            <TreeNodePDF cattle={dam} tag={cattle.damTagNumber} label="Dam" />
          </View>

          {/* Connector to subject */}
          <View style={{ alignItems: "center", marginBottom: 4 }}>
            <View style={styles.connector} />
          </View>

          {/* Subject */}
          <View style={{ alignItems: "center" }}>
            <Text style={[styles.treeLabel, { textAlign: "center" }]}>Subject</Text>
            <View style={styles.treeNodeRoot}>
              <Text style={styles.treeNodeTag}>{cattle.tagNumber}</Text>
              {cattle.nickname ? <Text style={styles.treeNodeSub}>{cattle.nickname}</Text> : null}
              <Text style={styles.treeNodeSub}>{formatDate(cattle.dateOfBirth)}</Text>
            </View>
          </View>
        </View>

        {/* Footer with single signature block */}
        <View style={styles.footer} fixed>
          <View style={styles.footerLine}>
            <Text style={{ fontSize: 9, marginBottom: 25, lineHeight: 1.4, fontStyle: "italic", color: "#333" }}>
              <Text>{"This certificate is issued for whatever legal purpose it may serve."}</Text>
              <Text>{"\n"}</Text>
              <Text>{"Given on this day, "}</Text>
              <Text style={{ fontWeight: "bold" }}>{formatDate(new Date().toISOString().slice(0, 10))}</Text>
              <Text>{"."}</Text>
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
              <View style={{ width: 200, alignItems: 'flex-start', marginRight: 20 }}>
                <View style={{ width: '100%', borderTop: '1pt solid #333', paddingTop: 6 }}>
                  <Text style={{ fontSize: 10, fontFamily: 'Helvetica-Bold' }}>{settings.ownerName || 'Owner'}</Text>
                </View>
                <Text style={{ fontSize: 9, color: '#888', marginTop: 4 }}>Registered Owner</Text>
              </View>
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
