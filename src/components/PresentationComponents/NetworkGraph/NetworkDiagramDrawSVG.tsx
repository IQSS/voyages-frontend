import * as d3 from 'd3';
import { forceLink, zoomIdentity } from 'd3';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Edges, Nodes } from '@/share/InterfaceTypePastNetworks';
import { ENSLAVEMENTNODE, RADIUSNODE } from '@/share/CONST_DATA';
import ShowsAcoloredNodeKey from './ShowsAcoloredNodeKey';
import { AppDispatch, RootState } from '@/redux/store';
import { useDispatch, useSelector } from 'react-redux';
import { createdLabelNodeHover } from '@/utils/functions/createdLabelNodeHover';
import {
  collectEdgeRoles,
  collectNodeClasses,
  edgeColor,
  edgeRoleColors,
  nodeColor,
} from '@/utils/functions/networkPalette';
import {
  setNetWorksID,
  setNetWorksKEY,
} from '@/redux/getPastNetworksGraphDataSlice';
import { fetchPastNetworksGraphApi } from '@/fetch/pastEnslavedFetch/fetchPastNetworksGraph';
import { setIsModalCard, setNodeClass } from '@/redux/getCardFlatObjectSlice';
import '@/style/networks.scss';

type NetworkDiagramProps = {
  width: number;
  height: number;
};

const CLICK_DELAY = 300;
const CHARGE_STRENGTH = -400;
const LINK_DISTANCE = 105;
const NODE_STROKE_WIDTH = '1';
const EDGE_STROKE_WIDTH = '2';
const CALLOUT_RING_OFFSET = 5;
const CALLOUT_RING_STROKE_WIDTH = '1';
const CALLOUT_RING_COLOR = '#e01e37';
const CALLOUT_COLOR = '#fff';
const CALLOUT_LABEL_HALO = 'rgba(0, 0, 0, 0.65)';

const endpointId = (endpoint: string | Nodes): string =>
  typeof endpoint === 'string' ? endpoint : endpoint?.uuid;

const edgeKey = (edge: Edges): string =>
  `${endpointId(edge.source)}->${endpointId(edge.target)}`;

export const NetworkDiagramDrawSVG = ({
  width,
  height,
}: NetworkDiagramProps) => {
  const {
    data: netWorkData,
    networkID,
    networkKEY,
  } = useSelector((state: RootState) => state.getPastNetworksGraphData);
  const edges: Edges[] = (netWorkData.edges ?? []).map((d) => ({ ...d }));
  const nodes: Nodes[] = (netWorkData.nodes ?? []).map((d) => ({ ...d }));

  const nodeIds = new Set(nodes.map((node) => node.uuid));
  const validEdges = edges.filter(
    (edge) =>
      nodeIds.has(endpointId(edge.source)) &&
      nodeIds.has(endpointId(edge.target)),
  );

  const dispatch: AppDispatch = useDispatch();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(zoomIdentity);
  const simulationRef = useRef<d3.Simulation<Nodes, Edges> | null>(null);
  const isDraggingRef = useRef(false);
  const clickTimeout = useRef<NodeJS.Timeout | undefined>();
  const calloutUuidsRef = useRef<Set<string>>(new Set());
  const seedNodeRef = useRef({ id: networkID, nodeClass: networkKEY });
  const calloutRingsRef = useRef<d3.Selection<
    SVGCircleElement,
    Nodes,
    SVGGElement,
    unknown
  > | null>(null);

  const linksGraphRef = useRef<d3.Selection<
    SVGLineElement,
    Edges,
    SVGGElement,
    unknown
  > | null>(null);
  const nodesGraphRef = useRef<d3.Selection<
    SVGCircleElement,
    Nodes,
    SVGGElement,
    unknown
  > | null>(null);
  const nodeLabelsRef = useRef<d3.Selection<
    SVGTextElement,
    Nodes,
    SVGGElement,
    unknown
  > | null>(null);

  const graph = useRef<{ nodes: Nodes[]; edges: Edges[] }>({
    nodes: nodes,
    edges: validEdges,
  });
  const netWorkDataRef = useRef(netWorkData);
  const [edgeRoles, setEdgeRoles] = useState<string[]>([]);
  const [nodeClasses, setNodeClasses] = useState<string[]>([]);

  const isCalloutNode = (node: Nodes) =>
    calloutUuidsRef.current.has(node.uuid);

  const clearClickTimeout = () => {
    if (clickTimeout.current !== undefined) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = undefined;
    }
  };

  const handleClickNodeShowCard = async (nodeId: number, nodeClass: string) => {
    if (nodeClass !== ENSLAVEMENTNODE) {
      dispatch(setIsModalCard(true));
      dispatch(setNodeClass(nodeClass));
      dispatch(setNetWorksID(nodeId));
      dispatch(setNetWorksKEY(nodeClass));
    }
  };

  const handleDoubleClick = async (nodeId: number, nodeClass: string) => {
    const dataSend = {
      [nodeClass]: [Number(nodeId)],
    };
    const response = await dispatch(
      fetchPastNetworksGraphApi(dataSend),
    ).unwrap();
    if (!response) return;

    const knownNodeIds = new Set(graph.current.nodes.map((node) => node.uuid));
    const newNodes: Nodes[] = ((response.nodes ?? []) as Nodes[]).filter(
      (newNode) => {
        if (!newNode?.uuid || knownNodeIds.has(newNode.uuid)) return false;
        knownNodeIds.add(newNode.uuid);
        return true;
      },
    );

    const origin = graph.current.nodes.find(
      (node) => node.id === nodeId && node.node_class === nodeClass,
    );
    const originX = origin?.x ?? width / 2;
    const originY = origin?.y ?? height / 2;
    newNodes.forEach((newNode) => {
      newNode.x = originX + (Math.random() - 0.5) * RADIUSNODE * 4;
      newNode.y = originY + (Math.random() - 0.5) * RADIUSNODE * 4;
    });

    const knownEdgeKeys = new Set(graph.current.edges.map(edgeKey));
    const newEdges: Edges[] = ((response.edges ?? []) as Edges[]).filter(
      (newEdge) => {
        const key = edgeKey(newEdge);
        if (knownEdgeKeys.has(key)) return false;
        if (
          !knownNodeIds.has(endpointId(newEdge.source)) ||
          !knownNodeIds.has(endpointId(newEdge.target))
        ) {
          return false;
        }
        knownEdgeKeys.add(key);
        return true;
      },
    );

    if (newNodes.length === 0 && newEdges.length === 0) return;

    if (origin?.uuid) {
      calloutUuidsRef.current.add(origin.uuid);
    }

    graph.current = {
      nodes: [...graph.current.nodes, ...newNodes],
      edges: [...graph.current.edges, ...newEdges],
    };

    updateNetwork();
  };

  function ticked() {
    linksGraphRef.current
      ?.attr('x1', (d) => (d.source as Nodes).x!)
      .attr('y1', (d) => (d.source as Nodes).y!)
      .attr('x2', (d) => (d.target as Nodes).x!)
      .attr('y2', (d) => (d.target as Nodes).y!);
    nodesGraphRef.current?.attr('transform', (d) => `translate(${d.x},${d.y})`);
    calloutRingsRef.current?.attr(
      'transform',
      (d) => `translate(${d.x},${d.y})`,
    );
    nodeLabelsRef.current
      ?.attr('x', (node) => node.x! + 17)
      .attr('y', (node) => node.y!);
  }

  const updateNetwork = useCallback(() => {
    if (!svgRef.current) return;
    const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);

    let networkGroup: d3.Selection<SVGGElement, unknown, null, undefined> =
      svg.select<SVGGElement>('#networkGroup');
    if (networkGroup.empty()) {
      networkGroup = svg.append('g').attr('id', 'networkGroup');
    }

    let link = networkGroup.select<SVGGElement>('#edges');
    if (link.empty()) {
      link = networkGroup.append('g').attr('id', 'edges');
    }

    let node = networkGroup.select<SVGGElement>('#nodes');
    if (node.empty()) {
      node = networkGroup.append('g').attr('id', 'nodes');
    }

    let labels = networkGroup.select<SVGGElement>('#labels');
    if (labels.empty()) {
      labels = networkGroup.append('g').attr('id', 'labels');
    }

    let callouts = networkGroup.select<SVGGElement>('#callouts');
    if (callouts.empty()) {
      callouts = networkGroup.append('g').attr('id', 'callouts');
    }

    const seed = seedNodeRef.current;
    if (seed.id !== null && seed.nodeClass) {
      const seedNode = graph.current.nodes.find(
        (candidate) =>
          candidate.id === Number(seed.id) &&
          candidate.node_class === seed.nodeClass,
      );
      if (seedNode?.uuid) {
        calloutUuidsRef.current.add(seedNode.uuid);
      }
    }

    const roles = collectEdgeRoles(graph.current.edges);
    const roleColors = edgeRoleColors(roles);
    setEdgeRoles((current) =>
      current.join('|') === roles.join('|') ? current : roles,
    );

    const presentNodeClasses = collectNodeClasses(graph.current.nodes);
    setNodeClasses((current) =>
      current.join('|') === presentNodeClasses.join('|')
        ? current
        : presentNodeClasses,
    );

    // Links
    const linkSelection = link
      .selectAll<SVGLineElement, Edges>('line')
      .data(graph.current.edges, edgeKey);

    linkSelection.exit().remove();

    const linkEnter = linkSelection
      .enter()
      .append('line')
      .attr('class', 'link-graph')
      .style('cursor', 'pointer');

    linksGraphRef.current = linkEnter.merge(linkSelection);
    linksGraphRef.current
      .attr('stroke-width', EDGE_STROKE_WIDTH)
      .attr('stroke', (edge: Edges) => edgeColor(edge, roleColors));

    // Nodes
    const nodeSelection = node
      .selectAll<SVGCircleElement, Nodes>('circle')
      .data(graph.current.nodes, (d) => d.uuid);

    nodeSelection.exit().remove();

    const nodeEnter = nodeSelection.enter().append('circle');

    nodesGraphRef.current = nodeEnter.merge(nodeSelection);
    nodesGraphRef.current
      .attr('opacity', 1)
      .attr('class', 'nodes')
      .attr('stroke', '#fff')
      .style('cursor', 'pointer')
      .attr('stroke-width', NODE_STROKE_WIDTH)
      .attr('r', RADIUSNODE)
      .attr('fill', (d: Nodes) => nodeColor(d.node_class));

    const calloutSelection = callouts
      .selectAll<SVGCircleElement, Nodes>('circle')
      .data(graph.current.nodes.filter(isCalloutNode), (d) => d.uuid);

    calloutSelection.exit().remove();

    const calloutEnter = calloutSelection
      .enter()
      .append('circle')
      .attr('class', 'callout-ring');

    calloutRingsRef.current = calloutEnter.merge(calloutSelection);
    calloutRingsRef.current
      .attr('r', RADIUSNODE + CALLOUT_RING_OFFSET)
      .attr('fill', 'none')
      .attr('stroke', CALLOUT_RING_COLOR)
      .attr('stroke-width', CALLOUT_RING_STROKE_WIDTH)
      .style('pointer-events', 'none');

    nodesGraphRef.current.on('click', (event: MouseEvent, d: Nodes) => {
      event.preventDefault();
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        return;
      }
      clearClickTimeout();
      if (event.detail >= 2) {
        handleDoubleClick(d.id, d.node_class);
        return;
      }
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = undefined;
        handleClickNodeShowCard(d.id, d.node_class);
      }, CLICK_DELAY);
    });

    nodesGraphRef.current.on('mouseover', (event: MouseEvent, d: Nodes) => {
      event.preventDefault();
      const labelNode = createdLabelNodeHover(d);
      const [x, y] = [d.x!, d.y!];
      const group = labels.append('g').attr('class', 'label-group');
      const textElement = group
        .append('text')
        .attr('class', 'label-hover')
        .attr('x', x + 22)
        .attr('y', y)
        .attr('text-anchor', 'start')
        .attr('alignment-baseline', 'start')
        .attr('font-size', 15)
        .attr('font-weight', 'bold')
        .attr('fill', '#000')
        .text(labelNode || '');
      const textBoundingBox = textElement.node()?.getBBox();
      if (textBoundingBox) {
        const rectPadding = 4;
        const rectWidth = textBoundingBox.width + 2 * rectPadding;
        const rectHeight = textBoundingBox.height + 2 * rectPadding;

        group
          .append('rect')
          .attr('class', 'background-rect')
          .attr('x', textBoundingBox.x - rectPadding)
          .attr('y', textBoundingBox.y - rectPadding)
          .attr('width', rectWidth)
          .attr('height', rectHeight)
          .attr('rx', 8)
          .attr('ry', 8)
          .attr('fill', '#fff');

        textElement.raise();
      }
    });

    nodesGraphRef.current.on('mouseout', (event: MouseEvent) => {
      event.preventDefault();
      d3.select('.label-hover').remove();
      d3.select('.background-rect').remove();
    });

    // Label
    const labelSelection = labels
      .selectAll<SVGTextElement, Nodes>('text.label')
      .data(graph.current.nodes, (d) => d.uuid);

    labelSelection.exit().remove();

    const labelEnter = labelSelection
      .enter()
      .append('text')
      .attr('class', 'label');
    nodeLabelsRef.current = labelEnter.merge(labelSelection);
    nodeLabelsRef.current
      .attr('text-anchor', 'start')
      .attr('alignment-baseline', 'middle')
      .attr('font-size', 15)
      .attr('font-weight', 'bold')
      .attr('fill', CALLOUT_COLOR)
      .attr('paint-order', 'stroke')
      .attr('stroke', CALLOUT_LABEL_HALO)
      .attr('stroke-width', 3)
      .style('pointer-events', 'none')
      .text((node) =>
        isCalloutNode(node) ? (createdLabelNodeHover(node) ?? '') : '',
      );

    /** Requested from JM-0116  
           * Right now, we are hiding the labels on enslavers and enslaved, and only showing those labels on rollover. 
           * Can we do the same thing with the yellow voyages nodes?
           * 
           ***  ** This code, will show label on voyages **** 
           * const newNodeLabels = nodeLabels.enter().append('text')
               .attr('class', 'label')
               .attr('x', (node) => !isNaN(Number(node.x)) ? Number(node.x) + 17 : 0)
               .attr('y', (node) => node.y!)
               .attr('text-anchor', 'start')
               .attr('alignment-baseline', 'start')
               .attr('font-size', 16)
               .attr('fill', '#fff')
               .attr('font-weight', 'bold')
           .text((node: Nodes) => {
               const nodeClass = isVoyagesClass(node)
               const labelNode = createdLabelNodeHover(node);
               return nodeClass ? labelNode! : '';
           });
           nodeLabels = newNodeLabels.merge(nodeLabels);
           */

    function handleZoom(event: d3.D3ZoomEvent<SVGSVGElement, any>) {
      transformRef.current = event.transform;
      if (svgRef.current && transformRef.current) {
        const transformString = `translate(${event.transform.x}, ${event.transform.y}) scale(${event.transform.k})`;
        d3.select('#networkGroup').attr('transform', transformString);
      }
    }

    const dragStarted = (event: d3.D3DragEvent<SVGGElement, Nodes, Nodes>) => {
      isDraggingRef.current = false;
      event.sourceEvent.stopPropagation();
      if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
      const d = event.subject;
      if (d) {
        d.fx = d.x;
        d.fy = d.y;
      }
    };

    const dragged = (event: d3.D3DragEvent<SVGGElement, Nodes, Nodes>) => {
      event.sourceEvent.stopPropagation();
      isDraggingRef.current = true;
      const d = event.subject;
      if (d) {
        d.fx = event.x || 0;
        d.fy = event.y || 0;
      }
    };

    const dragEnded = (event: d3.D3DragEvent<SVGGElement, Nodes, Nodes>) => {
      if (!event.active) simulationRef.current?.alphaTarget(0);
      const d = event.subject;
      if (d) {
        d.fx = null;
        d.fy = null;
      }
    };

    nodesGraphRef.current.call(
      d3
        .drag<SVGCircleElement, Nodes>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded),
    );

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 3.5])
      .on('zoom', handleZoom);

    svg
      .call(zoomBehavior as any)
      .on('dblclick.zoom', null)
      .on('click.zoom', null);

    if (!simulationRef.current) {
      simulationRef.current = d3
        .forceSimulation<Nodes, Edges>(graph.current.nodes)
        .force(
          'link',
          forceLink<Nodes, Edges>(graph.current.edges)
            .id((uuid) => uuid.uuid)
            .distance(LINK_DISTANCE),
        )
        .force('charge', d3.forceManyBody().strength(CHARGE_STRENGTH))
        .force(
          'center',
          d3
            .forceCenter()
            .x(width / 2)
            .y(height / 2),
        );
    } else {
      simulationRef.current.nodes(graph.current.nodes);
      const linkForce = simulationRef.current.force('link') as d3.ForceLink<
        Nodes,
        Edges
      > | null;
      linkForce?.links(graph.current.edges);
      simulationRef.current.force(
        'center',
        d3
          .forceCenter()
          .x(width / 2)
          .y(height / 2),
      );
    }

    simulationRef.current.on('tick', ticked);
    simulationRef.current.alpha(1).restart();
  }, [svgRef, width, height]);

  useEffect(() => {
    updateNetwork();
  }, []);

  useEffect(() => {
    if (netWorkDataRef.current === netWorkData) return;
    netWorkDataRef.current = netWorkData;
    calloutUuidsRef.current = new Set();
    seedNodeRef.current = { id: networkID, nodeClass: networkKEY };
    simulationRef.current?.stop();
    simulationRef.current = null;
    graph.current = { nodes: nodes, edges: validEdges };
    updateNetwork();
  }, [netWorkData, updateNetwork, networkID, networkKEY]);

  useEffect(() => {
    const svgCleanup = () => {
      if (svgRef.current) {
        const svg = d3.select<SVGSVGElement, unknown>(svgRef.current);
        svg.on('zoom', null);
      }
      transformRef.current = zoomIdentity;
      simulationRef.current?.stop();
      simulationRef.current = null;
      isDraggingRef.current = false;
      clearClickTimeout();
    };
    return svgCleanup;
  }, []);

  return (
    <>
      <svg
        ref={svgRef}
        className="svg-network"
        width={width}
        height={height}
        id="networkCanvas labelsContainer"
      ></svg>
      <ShowsAcoloredNodeKey edgeRoles={edgeRoles} nodeClasses={nodeClasses} />
    </>
  );
};
