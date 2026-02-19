import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import React from "react";
import { type Bid } from "@/app/types";
import { type BidDocumentSpec, type BidDocumentSection } from "@/app/lib/openai/bids";

// --- Styles ---

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#222",
  },
  heading: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 12,
    color: "#1a1a2e",
  },
  subheading: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    marginTop: 12,
    color: "#16213e",
  },
  paragraph: {
    marginBottom: 8,
    lineHeight: 1.5,
  },
  tableContainer: {
    marginTop: 6,
    marginBottom: 12,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#ccc",
    paddingVertical: 4,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#1a1a2e",
    paddingVertical: 5,
    borderRadius: 2,
  },
  tableHeaderCell: {
    flex: 1,
    color: "#fff",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
    paddingHorizontal: 4,
  },
  tableCell: {
    flex: 1,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  totalsContainer: {
    marginTop: 16,
    alignItems: "flex-end",
  },
  totalsRow: {
    flexDirection: "row",
    marginBottom: 4,
    minWidth: 200,
  },
  totalsLabel: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  totalsValue: {
    fontSize: 10,
    textAlign: "right",
    minWidth: 80,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a2e",
    marginVertical: 10,
  },
});

// --- Section renderers ---

function HeadingSection({ section }: { section: BidDocumentSection }) {
  return (
    <View>
      <Text style={section.title?.length && section.title.length > 30 ? styles.subheading : styles.heading}>
        {section.title}
      </Text>
      <View style={styles.divider} />
    </View>
  );
}

function ParagraphSection({ section }: { section: BidDocumentSection }) {
  return <Text style={styles.paragraph}>{section.content}</Text>;
}

function TableSection({ section }: { section: BidDocumentSection }) {
  const columns = section.columns ?? [];
  const rows = section.rows ?? [];
  return (
    <View style={styles.tableContainer}>
      {section.title && <Text style={styles.subheading}>{section.title}</Text>}
      <View style={styles.tableHeaderRow}>
        {columns.map((col, i) => (
          <Text key={i} style={styles.tableHeaderCell}>
            {col}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.tableRow}>
          {row.map((cell, ci) => (
            <Text key={ci} style={styles.tableCell}>
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

function TotalsSection({ section }: { section: BidDocumentSection }) {
  const items = section.items ?? [];
  return (
    <View style={styles.totalsContainer}>
      <View style={styles.divider} />
      {items.map((item, i) => (
        <View key={i} style={styles.totalsRow}>
          <Text style={styles.totalsLabel}>{item.label}</Text>
          <Text style={styles.totalsValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function renderSection(section: BidDocumentSection, index: number) {
  switch (section.type) {
    case "heading":
      return <HeadingSection key={index} section={section} />;
    case "paragraph":
      return <ParagraphSection key={index} section={section} />;
    case "table":
      return <TableSection key={index} section={section} />;
    case "totals":
      return <TotalsSection key={index} section={section} />;
    default:
      return null;
  }
}

// --- BidDocument component ---

function BidDocument({ docSpec }: { bid: Partial<Bid>; docSpec: BidDocumentSpec }) {
  return (
    <Document title={docSpec.title}>
      <Page size="A4" style={styles.page}>
        {docSpec.sections.map((section, i) => renderSection(section, i))}
      </Page>
    </Document>
  );
}

// --- Public API ---

export async function renderBidPdf(bid: Partial<Bid>, docSpec: BidDocumentSpec): Promise<Buffer> {
  const element = <BidDocument bid={bid} docSpec={docSpec} />;
  return renderToBuffer(element);
}
