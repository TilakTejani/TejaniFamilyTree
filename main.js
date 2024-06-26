fetch("./treedata.json")
  .then(function (resp) {
    return resp.json();
  })
  .then(function (data) {
    console.log("Test");
    parentFunction(data);
  });

function hideBanner() {
  document.getElementById("dataBanner").style.display = "none";
}
function parentFunction(jsondata) {
  const width = 1400;
  const marginTop = 30;
  const marginRight = 10;
  const marginBottom = 10;
  const marginLeft = 200;
  console.log("the data is");
  console.log(jsondata);

  let mouseX = 0;
  //these global variables I should later get via closure
  let buttonTracker = [];
  let root = d3
    .stratify()
    .id((d) => d.Name)
    .parentId((d) => d.Father)(jsondata);
  const dx = 20;
  const dy = (width - marginRight - marginLeft) / (1 + root.height);
  const tree = d3.tree().nodeSize([dx, dy]);
  const diagonal = d3
    .linkHorizontal()
    .x((d) => d.y)
    .y((d) => d.x);

  // Create the SVG container, a layer for the links and a layer for the nodes.
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", dx)
    .attr("viewBox", [-marginLeft, -marginTop, width, dx])
    .attr(
      "style",
      "max-width: 100%; height: auto; font: 10px sans-serif; user-select: none;"
    );

  const gLink = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5);

  const gNode = svg
    .append("g")
    .attr("cursor", "pointer")
    .attr("pointer-events", "all");

  function update(source) {
    const duration = 250;
    if (!source) {
      console.log("Collapsing or no child on node", source);
      return;
    }
    console.log(source);

    let nodes = root.descendants().reverse();
    let links = root.links();

    // Compute the new tree layout.
    tree(root);

    let left = root;
    let right = root;
    root.eachBefore((node) => {
      if (node.x < left.x) left = node;
      if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + marginTop + marginBottom;

    const transition = svg
      .transition(0, 0)
      .duration(duration)
      .attr("height", height)
      .attr("viewBox", [-marginLeft, left.x - marginTop, width, height])
      .tween(
        "resize",
        window.ResizeObserver ? null : () => () => svg.dispatch("toggle")
      );

    // Update the nodes…
    const node = gNode.selectAll("g").data(nodes, (d) => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node
      .enter()
      .append("g")
      .attr("transform", (source) => `translate(${source.y0},${source.x0})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0)
      .on("dblclick", (d) => {
        console.log(d);
        d.children = d.children ? null : d._children;
        update(d);
      })
      .on("mousedown", function () {
        startTime = new Date();
      })
      .on("mouseup", function (d) {
        endTime = new Date();
        if (endTime - startTime > 200) {
          console.log(
            "long click, " + (endTime - startTime) + " milliseconds long"
          );

          console.log(d);
          let banner = document.getElementById("dataBanner");
          let image = d.data["Image"] ? d.data["Image"] : "./unknown_image.png";
          let spouseImage = d.data["Spouse Image"]
            ? d.data["Spouse Image"]
            : "./unknown_image.png";
          let string = "<div>";
          string = string + "<div ><img id='bannerPhoto' src='" + image + "'/>";
          string =
            string + "<img id='bannerPhoto'src='" + spouseImage + "'/></div>";
          string = string + "<ul>";
          string = string + "<li>Name: " + d.data.Name + "</li>";

          if (d.data["Spouse Name"])
            string =
              string + "<li>Spouse Name: " + d.data["Spouse Name"] + "</li>";
          if (d.data["Occupation"])
            string =
              string + "<li>Occupation: " + d.data["Occupation"] + "</li>";
          if (d.data["Stay"])
            string = string + "<li>Stay: " + d.data["Stay"] + "</li>";
          if (d.data["Contact No"])
            string =
              string + "<li>Contact No: " + d.data["Contact No"] + "</li>";
          string = string + "</ul>";
          banner.innerHTML =
            string +
            '<button onclick="hideBanner()"><img src="icons8-close-50.png" height="10" width="10"/></button>';

          banner.style.display = "flex";
        }
      });

    nodeEnter
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", (d) => (d._children ? "#888" : "white"))
      .attr("stroke", "black")
      // .attr("fill", (d) => (d._children ? "#555" : "#999"))
      .attr("stroke-width", 1);

    nodeEnter
      .append("image")
      .attr("xlink:href", (d) =>
        d.data.Image ? d.data.Image : "./unknown_image.png"
      )
      .attr("x", -25) // Adjust x position as needed
      .attr("y", -20) // Adjust y position as needed
      .attr("height", 20) // Set the height of the image
      .attr("width", 20); // Set the width of the image

    nodeEnter
      .append("text")
      .text((d) => d.data.Name)
      // .attr("x", -5)
      .attr("dy", "-0.5em")
      .attr("text-anchor", "start")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 0.1)
      .attr("stroke", "black")
      .attr("paint-order", "stroke");

    // Transition nodes to their new position.
    const nodeUpdate = node
      .merge(nodeEnter)
      .transition(transition)
      .attr("transform", (d) => `translate(${d.y},${d.x})`)
      .attr("fill-opacity", 1)
      .attr("stroke-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node
      .exit()
      .transition(transition)
      .remove()
      .attr("transform", (d) => `translate(${source.y},${source.x})`)
      .attr("fill-opacity", 0)
      .attr("stroke-opacity", 0);

    // Update the links…
    const link = gLink.selectAll("path").data(links, (d) => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link
      .enter()
      .append("path")
      .attr("d", (d) => {
        const o = { x: source.x0, y: source.y0 };
        return diagonal({ source: o, target: o });
      });

    // Transition links to their new position.
    link.merge(linkEnter).transition(transition).attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link
      .exit()
      .transition(transition)
      .remove()
      .attr("d", (d) => {
        const o = { x: source.x, y: source.y };
        return diagonal({ source: o, target: o });
      });

    // Stash the old positions for transition.
    root.eachBefore((d) => {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }

  // Do the first update to the initial configuration of the tree — where a number of nodes
  // are open (arbitrarily selected as the root, plus nodes with 7 letters).
  root.x0 = dy / 2;
  root.y0 = 0;
  root.descendants().forEach((d, i) => {
    d.id = i;
    d._children = d.children;
    // console.log(d._÷children.length);
    if (d.depth && d._children && d._children.length < 2) d.children = null;
  });

  update(root);

  document.getElementById("chart").append(svg.node());
  //   return svg.node();
}
