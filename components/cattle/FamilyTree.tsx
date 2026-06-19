"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Cattle } from "@/types"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TreeNode {
  cattle: Cattle | null
  tagNumber: string
  sire: TreeNode | null
  dam: TreeNode | null
  depth: number
}

function buildTree(
  tagNumber: string,
  allCattle: Cattle[],
  depth: number,
  maxDepth: number
): TreeNode {
  const cattle = allCattle.find((c) => c.tagNumber === tagNumber) || null
  return {
    cattle,
    tagNumber,
    sire:
      cattle?.sireTagNumber && depth < maxDepth
        ? buildTree(cattle.sireTagNumber, allCattle, depth + 1, maxDepth)
        : null,
    dam:
      cattle?.damTagNumber && depth < maxDepth
        ? buildTree(cattle.damTagNumber, allCattle, depth + 1, maxDepth)
        : null,
    depth,
  }
}

const CARD_BASE =
  "group relative flex h-28 w-36 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-xl border bg-card px-3 text-center text-sm shadow-sm transition-all"

function NodeCard({ node, isRoot }: { node: TreeNode; isRoot?: boolean }) {
  const { cattle, tagNumber } = node
  const male = cattle?.sex === "male"
  const female = cattle?.sex === "female"

  return (
    <Link
      href={cattle ? `/cattle/${cattle.tagNumber}` : "#"}
      onClick={(e) => !cattle && e.preventDefault()}
      data-root-node={isRoot ? "true" : undefined}
      className={cn(
        CARD_BASE,
        cattle && "hover:-translate-y-0.5 hover:border-primary hover:shadow-md",
        isRoot && "border-primary/70 bg-primary/5 ring-2 ring-primary/25",
        !cattle && "cursor-default border-dashed bg-muted/40 text-muted-foreground shadow-none"
      )}
    >
      {/* Sex accent bar */}
      {cattle && (
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-1",
            male ? "bg-blue-400" : female ? "bg-pink-400" : "bg-muted-foreground/40"
          )}
        />
      )}
      <p className="font-mono text-sm font-semibold leading-tight">{tagNumber}</p>
      {cattle?.nickname && (
        <p className="max-w-full truncate text-xs text-muted-foreground">{cattle.nickname}</p>
      )}
      {cattle?.dateOfBirth && (
        <p className="text-[11px] text-muted-foreground">{formatDate(cattle.dateOfBirth)}</p>
      )}
      {cattle?.sex ? (
        <span
          className={cn(
            "mt-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
            male
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
              : "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
          )}
        >
          {male ? "♂ Bull" : "♀ Cow"}
        </span>
      ) : (
        <span className="text-xs italic text-muted-foreground">Not in record</span>
      )}
    </Link>
  )
}

function PlaceholderCard({ label }: { label: string }) {
  return (
    <div className={cn(CARD_BASE, "border-dashed bg-muted/40 text-muted-foreground shadow-none")}>
      <p className="font-mono text-sm font-semibold leading-tight">{label}</p>
      <span className="text-xs italic text-muted-foreground">Not in record</span>
    </div>
  )
}

const GENERATION_DECAY = 0.82
const MIN_BRANCH_WEIGHT = 0.35
const MAX_SIBLING_SPAN_RATIO = 2.5

function branchSpan(node: TreeNode | null, depth = 0): number {
  // Deeper generations contribute progressively less width to avoid runaway expansion.
  const leafWeight = Math.max(MIN_BRANCH_WEIGHT, Math.pow(GENERATION_DECAY, depth))
  if (!node) return leafWeight

  const hasParents = !!(node.sire || node.dam)
  if (!hasParents) return leafWeight

  return branchSpan(node.sire, depth + 1) + branchSpan(node.dam, depth + 1)
}

function capSpanRatio(left: number, right: number): [number, number] {
  if (left <= 0 || right <= 0) return [Math.max(left, 0.1), Math.max(right, 0.1)]
  if (left / right > MAX_SIBLING_SPAN_RATIO) return [right * MAX_SIBLING_SPAN_RATIO, right]
  if (right / left > MAX_SIBLING_SPAN_RATIO) return [left, left * MAX_SIBLING_SPAN_RATIO]
  return [left, right]
}

/** Clean bracket: short drops from each parent, a joining bar, and a center stem to the child. */
function ParentConnector({ sireSpan, damSpan }: { sireSpan: number; damSpan: number }) {
  const total = sireSpan + damSpan
  const leftPct = (sireSpan / (2 * total)) * 100
  const rightPct = ((sireSpan + damSpan / 2) / total) * 100
  const centerPct = 50

  return (
    <div className="relative h-6 w-full" aria-hidden>
      {/* drops from each parent center */}
      <div className="absolute top-0 h-3 border-l-2 border-border" style={{ left: `${leftPct}%` }} />
      <div className="absolute top-0 h-3 border-l-2 border-border" style={{ left: `${rightPct}%` }} />
      {/* horizontal joining bar */}
      <div
        className="absolute top-3 border-t-2 border-border"
        style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
      />
      {/* center stem down to the child */}
      <div className="absolute top-3 h-3 -translate-x-1/2 border-l-2 border-border" style={{ left: `${centerPct}%` }} />
    </div>
  )
}

function AncestorNode({ node, isRoot }: { node: TreeNode; isRoot?: boolean }) {
  const hasParents = !!(node.sire || node.dam)
  const [sireSpan, damSpan] = capSpanRatio(branchSpan(node.sire), branchSpan(node.dam))

  return (
    <div className="flex flex-col items-center">
      {hasParents && (
        <>
          {/* Parent columns scale with branch span to keep connectors aligned at deeper levels. */}
          <div
            className="grid w-full items-end"
            style={{ gridTemplateColumns: `${sireSpan}fr ${damSpan}fr` }}
          >
            <div className="flex min-w-0 justify-center px-4">
              {node.sire ? <AncestorNode node={node.sire} /> : <PlaceholderCard label="Sire" />}
            </div>
            <div className="flex min-w-0 justify-center px-4">
              {node.dam ? <AncestorNode node={node.dam} /> : <PlaceholderCard label="Dam" />}
            </div>
          </div>
          <ParentConnector sireSpan={sireSpan} damSpan={damSpan} />
        </>
      )}
      <NodeCard node={node} isRoot={isRoot} />
    </div>
  )
}

interface FamilyTreeProps {
  cattle: Cattle
  allCattle: Cattle[]
}

export function FamilyTree({ cattle, allCattle }: FamilyTreeProps) {
  const [expanded, setExpanded] = useState(false)
  const screenTreeScrollRef = useRef<HTMLDivElement | null>(null)
  const maxDepth = expanded ? 8 : 3

  const tree = useMemo(
    () => buildTree(cattle.tagNumber, allCattle, 0, maxDepth),
    [cattle.tagNumber, allCattle, maxDepth]
  )

  // Always build a depth-3 tree for print output regardless of expanded state
  const printTree = useMemo(
    () => buildTree(cattle.tagNumber, allCattle, 0, 3),
    [cattle.tagNumber, allCattle]
  )

  // Check if there are more ancestors beyond the initial view
  const canExpand = useMemo(() => {
    function hasDeeper(tagNumber: string, depth: number): boolean {
      if (depth === 0) return false
      const c = allCattle.find((x) => x.tagNumber === tagNumber)
      if (!c) return false
      if (depth === 1) return !!(c.sireTagNumber || c.damTagNumber)
      return (
        (!!c.sireTagNumber && hasDeeper(c.sireTagNumber, depth - 1)) ||
        (!!c.damTagNumber && hasDeeper(c.damTagNumber, depth - 1))
      )
    }
    return hasDeeper(cattle.tagNumber, 4) // any ancestor beyond depth 3?
  }, [cattle.tagNumber, allCattle])

  const hasAncestors = tree.sire || tree.dam

  useEffect(() => {
    if (!hasAncestors) return

    const container = screenTreeScrollRef.current
    if (!container) return

    const rootNode = container.querySelector<HTMLElement>("[data-root-node='true']")
    if (!rootNode) return

    const containerRect = container.getBoundingClientRect()
    const rootRect = rootNode.getBoundingClientRect()
    const desiredScrollLeft =
      container.scrollLeft +
      (rootRect.left + rootRect.width / 2) -
      (containerRect.left + containerRect.width / 2)

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth)
    const clamped = Math.min(Math.max(desiredScrollLeft, 0), maxScrollLeft)
    container.scrollTo({ left: clamped, behavior: "auto" })
  }, [expanded, cattle.tagNumber, hasAncestors, tree])

  if (!hasAncestors) {
    return (
      <>
        <div className="pt-2 mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Pedigree / Family Tree</h3>
        </div>
        <div className="flex flex-col items-center py-8 text-muted-foreground">
          <p className="text-sm">No ancestry records available.</p>
          <p className="text-xs mt-1">Add sire/dam tag numbers to see the family tree.</p>
        </div>
      </>
    )
  }

  const legend = (
    <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-muted-foreground">
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded border border-primary bg-primary/10" />
        Subject
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded bg-blue-100 dark:bg-blue-900" />
        Male (♂)
      </span>
      <span className="flex items-center gap-1">
        <span className="inline-block w-3 h-3 rounded bg-pink-100 dark:bg-pink-900" />
        Female (♀)
      </span>
    </div>
  )

  return (
    <>
      <div className="pt-2 mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold">Pedigree / Family Tree</h3>
        {(canExpand || expanded) && (
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs px-2 print:hidden"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <><ChevronUp className="mr-1 h-3 w-3" /> Collapse</>
            ) : (
              <><ChevronDown className="mr-1 h-3 w-3" /> Expand full tree</>
            )}
          </Button>
        )}
      </div>

      {/* Screen: interactive expand/collapse */}
      <div className="print:hidden py-2">
        {legend}
      </div>

      <div ref={screenTreeScrollRef} className="print:hidden overflow-x-auto py-2">
        <div className="flex justify-center min-w-max px-4">
          <AncestorNode node={tree} isRoot />
        </div>
      </div>

      {/* Print: always depth 3 */}
      <div className="hidden print:block overflow-x-auto py-4">
        <div className="flex justify-center min-w-max px-4">
          <AncestorNode node={printTree} isRoot />
        </div>
        <div className="mt-4">{legend}</div>
      </div>
    </>
  )
}
