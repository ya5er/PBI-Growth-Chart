"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import { VisualSettings } from "./settings";
import * as d3 from 'd3';


interface chartRow {
    date: Date,
    value: number,
    annotation: string
};

interface Annotation {
    id: number,
    x: number,
    y: number,
    graphx: number,
    graphy: number,
    value: number,
    date: Date,
    text: string
}

export class Visual implements IVisual {
    private target: HTMLElement;
    private settings: VisualSettings;
    private container: d3.Selection<HTMLDivElement, any, HTMLDivElement, any>;
    private annotations: Annotation[];

    constructor(options: VisualConstructorOptions) {
        console.log('Visual constructor', options);
        this.target = options.element;

        /** Create the chart container when the visual loads */
        this.container = d3.select(this.target)
            .append('div')
                .attr('id', 'my_dataviz');

        this.annotations = [];
    }

    public update(options: VisualUpdateOptions) {
        console.log('Visual update', options);
        this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);
        let settings = this.settings;

        console.log(this.settings);
        
        // Clear down existing plot
        this.container.selectAll('*').remove();

        // Remove tooltip in case of glitch
        d3.select('body').selectAll('div.tooltip').remove();

        console.log(options.dataViews);

        // Test 1: Data view has both fields added
        let dataViews = options.dataViews;
        console.log(dataViews);
        console.log('Test 1: Valid data view...');
        if (!dataViews
            || !dataViews[0]
            || !dataViews[0].table
            || !dataViews[0].table.rows
            || !dataViews[0].metadata
        ) {
            console.log('Test 1 FAILED. No data to draw table.');
            return;
        }
    
        // If we get this far, we can trust that we can work with the data
        let table = dataViews[0].table;

        // Get indeces of date, comment, and number 
        // (can be in different order depending on how the data was uploaded)
        const dateIndex: number = table.columns.findIndex((item) => item.type.dateTime);
        const commentIndex: number = table.columns.findIndex((item) => item.type.text);
        const numberIndex: number = table.columns.findIndex((item) => item.type.numeric);

        // Convert the date string to Date type
        const newDates: Date[] = table.rows.map((row: any[]) => {
            const dateString: string = row[dateIndex] as string;
            return new Date(dateString);
        });

        const hasAllTypes: boolean = [dateIndex, commentIndex, numberIndex].every((index) => index !== -1);
            
        // Test 2: Category matches our expected data type (dateTime)
        console.log('Test 2: Table row has all 3 types...');
        if (!hasAllTypes) {
            console.log('Test 2 FAILED. Incorrect data type.');
            return;
        }
    
        // Map our data into an array.
        // We're going to map the `table.rows` array in-place and return
        // an `chartRow` object for each entry. Because the values array elements
        // correspond with their equivalent `table.rows` element, we can use
        // the current index to get the value as we map.
        let data: chartRow[] = table.rows.map(
            (row, idx) => (
                {
                    date: <Date>newDates[idx],
                    value: <number>row[numberIndex],
                    annotation: <string>row[commentIndex]
                }
            )
        );
    
        // Parse our mapped data and view the output 
        console.log(data);

        // Set the dimensions and margins of the graph
        var margin = {top: 10, right: 70, bottom: 30, left: 60},
            width = options.viewport.width - margin.left - margin.right,
            height = options.viewport.height - margin.top - margin.bottom;

        // create tooltip div
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("background-color", this.settings.TooltipSettings.TooltipColour);

        // Append the svg object to the body of the page
        var svg = this.container
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");
                                
        // Set X axis values (date format)
        var x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .range([ 0, width ]);

        // Add X axis
        svg.append('g')
            .classed('x-axis-g', true)  
            .attr('transform', 'translate(0,' + height + ')')
            .call(d3.axisBottom(x)
                .tickFormat(function(date : Date){
                    if (d3.timeYear(date) < date) {
                    return d3.timeFormat('%b')(date);
                    } else {
                    return d3.timeFormat('%Y')(date);
                    }
                })
                .ticks(this.settings.XAxisSettings.TickCount))
            .call(g => {
                // font settings
                g.selectAll('.x-axis-g text')
                    .style('fill', this.settings.XAxisSettings.FontColor)
                    .style('font-family', this.settings.XAxisSettings.FontFamily)
                    .style('font-size', this.settings.XAxisSettings.FontSize);

                g.selectAll('.x-axis-g text')
                    .attr('transform', `translate(${this.settings.XAxisSettings.XOffset}, ${-this.settings.XAxisSettings.YOffset}) rotate(-${this.settings.XAxisSettings.LabelAngle})`)
                    .style('text-anchor', this.settings.XAxisSettings.LabelAngle ? 'end' : 'middle');
            });

        // Set Y axis values
        let minvalue = this.settings.YAxisSettings.MinValue;
        let maxvalue = this.settings.YAxisSettings.MaxValue <= minvalue ? d3.max(data, function(d) { return +d.value; }) : this.settings.YAxisSettings.MaxValue;

        var y = d3.scaleLinear()
            .domain([minvalue, maxvalue])
            .range([ height, 0 ]);
        
        // Add Y axis
        svg.append('g')
            .classed('y-axis-g', true)
            .call(d3.axisLeft(y)
                .tickFormat(data => {
                    // formats y-axis labels with appropriate units
                    return nFormatter(parseInt(data.toString()), this.settings.YAxisSettings.DisplayDigits, this.settings.YAxisSettings.DisplayUnits);
                })
                .ticks(this.settings.YAxisSettings.TickCount))
            .call(_ => { 
                d3.selectAll('.y-axis-g text')
                    .style('fill', this.settings.YAxisSettings.FontColor)
                    .style('font-family', this.settings.YAxisSettings.FontFamily)
                    .style('font-size', this.settings.YAxisSettings.FontSize); 
                });

        
        function nFormatter(num: number, digits: number, displayUnits: string): string {
            // converts 15,000 to 15k and etc
            let si = [
                { value: 1, symbol: '', text: 'none' },
                { value: 1E3, symbol: 'K', text: 'thousands' },
                { value: 1E6, symbol: 'M', text: 'millions' },
                { value: 1E9, symbol: 'B', text: 'billions' },
                { value: 1E12, symbol: 'T', text: 'trillions' },
                { value: 1E15, symbol: 'P', text: 'quadrillions' },
                { value: 1E18, symbol: 'E', text: 'quintillions' }
            ];

            let i;
            // converts numbers into largest reasonable units unless otherwise specified
            if (displayUnits == 'auto') {
                for (i = si.length - 1; i > 0; i--) {
                    if (num >= si[i].value) {
                        break;
                    }
                }
            } else {
                for (i = 0; i < si.length - 1; i++) {
                    if (displayUnits == si[i].text) {
                        break;
                    }
                }
            }
            return parseFloat((num / si[i].value).toFixed(digits)).toLocaleString() + si[i].symbol;
        }

        // Add the line
        svg.append('path')
            .datum(data)
                .attr('fill', 'none')
                .attr('stroke', settings.LineSettings.LineColor)
                .attr('stroke-width', 1.5)
                .attr('d', d3.line<chartRow>()
                    .x(function(d) { return x(d.date) })
                    .y(function(d) { return y(d.value) })
                )


        // Add a circle element

        const circle = svg.append("circle")
            .attr("r", 0)
            .attr("fill", this.settings.TooltipSettings.TooltipColour)
            .style("stroke", "white")
            .attr("opacity", .70)
            .style("pointer-events", "none");

        const listeningRect = svg.append("rect")
            .attr("width", width)
            .attr("height", height);
        
        if (this.settings.TooltipSettings.ToggleTooltip) {
            // create the mouse move function
            listeningRect.on("mousemove", function (event) {
                const [xCoord] = d3.pointer(event, this);
                const bisectDate = d3.bisector(function(d: chartRow) { return d.date }).left;
                const x0 = x.invert(xCoord);
                const i = bisectDate(data, x0, 1);
                const d0 = data[i - 1];
                const d1 = data[i];
                const d = x0.valueOf() - d0.date.valueOf() > d1.date.valueOf() - x0.valueOf() ? d1 : d0;
                const xPos = x(d.date);
                const yPos = y(d.value);

                // Update the circle position
                circle.attr("cx", xPos)
                    .attr("cy", yPos);

                // Add transition for the circle radius
                circle.transition()
                    .duration(50)
                    .attr("r", 5);

                // add in our tooltip
                tooltip
                    .style("display", "block")
                    .style("left", `${xPos > (width / 2) ? xPos - 75 : xPos + 75}px`)
                    .style("top", `${yPos + 30}px`)
                    .html(`<strong>Date:</strong> ${d.date.toLocaleDateString('en-US')}<br>
                            <strong>Value:</strong> ${d.value !== undefined ? d.value.toFixed(2) : 'N/A'}<br>
                            ${d.annotation !== null ? d.annotation : ''}`)
            });

            // listening rectangle mouse leave function
            listeningRect.on("mouseleave", function () {
                circle.transition()
                    .duration(50)
                    .attr("r", 0);

                tooltip.style("display", "none");
            });
        }

        // Growth Indicator
        if (this.settings.GrowthIndicator.ToggleGrowthIndicator) {
            // Get data points selected
            let selector1 = this.settings.GrowthIndicator.Selector1;
            let selector2 = this.settings.GrowthIndicator.Selector2;

            // Check if selectors are valid and find their index
            let s1Index = (selector1 && (getIndex(selector1, data) != -1)) ? getIndex(selector1, data) : data.length - 2;
            let s2Index = (selector2 && (getIndex(selector2, data) != -1)) ? getIndex(selector2, data) : data.length - 1;
            
            let growthPoint1 = data[s1Index];
            let growthPoint2 = data[s2Index];

            console.log(growthPoint1);
            console.log(growthPoint2);

            // Draw circles on points selected
            let growthCircle1 = svg.append("circle")
                .attr("class", "graphPoint")
                .attr("fill", settings.LineSettings.LineColor)
                .attr("cx", x(growthPoint1.date))
                .attr("cy", y(growthPoint1.value))
                .attr("r", 5);

            let growthCircle2 = svg.append("circle")
                .attr("class", "graphPoint")
                .attr("fill", settings.LineSettings.LineColor)
                .attr("cx", x(growthPoint2.date))
                .attr("cy", y(growthPoint2.value))
                .attr("r", 5);

            // Create path
            let widthOffset = 20;
            let path = d3.line()([
                [x(growthPoint1.date), y(growthPoint1.value)],
                [width + widthOffset, y(growthPoint1.value)],
                [width + widthOffset, y(growthPoint2.value)],
                [x(growthPoint2.date), y(growthPoint2.value)]
            ]);

            // Draw path
            svg.append('path')
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('stroke-width', '1')
                .attr('stroke-dasharray', '5,4')
                .attr('d', path);

            let growthPercent = (growthPoint2.value - growthPoint1.value) / growthPoint1.value * 100;
            growthPercent = Math.round(growthPercent * 10) / 10;
            let growthPercentStr = growthPercent > 0 ? '+' + growthPercent : growthPercent;

            let increasing = growthPercent > 0 ? true : false;
            let minY = (y(growthPoint1.value) >= y(growthPoint2.value)) ? y(growthPoint2.value) : y(growthPoint1.value);
            let maxY = (y(growthPoint1.value) >= y(growthPoint2.value)) ? y(growthPoint1.value) : y(growthPoint2.value);

            // Arrowhead
            if (this.settings.GrowthIndicator.ShowArrow) {
                svg.append('path')
                    .attr('d', d3.symbol().type(d3.symbolTriangle).size(this.settings.GrowthIndicator.ArrowSize))
                    .attr('fill', growthPercent > 0 ? this.settings.GrowthIndicator.IncreasingColour : this.settings.GrowthIndicator.DecreasingColour)
                    .attr('transform', `translate(${width + widthOffset}, ${increasing ? minY : maxY}) rotate(${increasing ? 0 : 60})`);
            }

            let arrowLine = svg.append('line')
                .attr('x1', width + widthOffset)
                .attr('y1', y(growthPoint1.value))
                .attr('x2', width + widthOffset)
                .attr('y2', y(growthPoint2.value))
                .attr('stroke', growthPercent >= 0 ? this.settings.GrowthIndicator.IncreasingColour : this.settings.GrowthIndicator.DecreasingColour)
                .attr('stroke-width', 2);

            let growthText = svg.append('text')
                .attr('fill', 'black')
                .attr('font-size', 12)
                .attr('dominant-baseline', 'middle')
                .attr('y', (y(growthPoint1.value) + y(growthPoint2.value)) / 2)
                .attr('x', width + widthOffset + 5)
                .text(growthPercentStr + '%');

        }


        // get index of selector
        function getIndex(selector: string, dataArray: chartRow[]): number {
            /* 
            * Param: selector, dataArray
            * Returns: corresponding column index in data table
            */
            let selectorIdx = -1; 
            const selectorDate = new Date(selector);

            dataArray.forEach((data, idx) => {
                if (data.date.toLocaleDateString('en-US') == selectorDate.toLocaleDateString('en-US')) {
                    selectorIdx = idx;
                }
            });

            return selectorIdx;
        }


        // Drag functionality
        let drag = d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended);

        function dragstarted(event, d) {
            //d3.select(this).raise().attr("stroke", "black");
        }
            
        function dragged(event, d) {
            d3.select(this).attr("cx", d.x = event.x).attr("cy", d.y = event.y);
            update();
        }
            
        function dragended(event, d) {
            d3.select(this).attr("stroke", null);
        }

        //let annotations = []

        // Count the number of existing text and line elements
        const existingTextCount = svg.selectAll('text').size();
        const existingLineCount = svg.selectAll('line').size();

        // Loop through rows to create annotations
        if (this.annotations.length == 0) {
            data.forEach((row, idx) => {
                if (row.annotation != null) {
                    this.annotations.push({
                        id: this.annotations.length,
                        x: x(row.date),
                        y: y(row.value),
                        graphx: x(row.date),
                        graphy: y(row.value),
                        value: row.value,
                        date: row.date,
                        text: row.annotation
                    });
                }
            });
        } 

        console.log(this.annotations);

        // Filter out the text/line elements based on their indices, 
        //  so that only the annotations are included
        let newTextElements = svg.selectAll('text')
            .filter(function(_, i) {
                return i >= existingTextCount;
            });
        let newLineElements = svg.selectAll('line')
            .filter(function(_, i) {
                return i >= existingLineCount;
            });

        let annotations = this.annotations;
        
        // Update annotation after being dragged
        function update() {
            let fontsize = settings.AnnotationSettings.FontSize;

            svg.selectAll('.annotationText')
                .data(annotations)
                .join('text')
                .attr('x', function(d: Annotation) { return d.x; })
                .attr('y', function(d: Annotation) { return d.y; })
                .attr('font-size', fontsize)
                .style('fill', settings.AnnotationSettings.FontColor)
                .style('font-family', settings.AnnotationSettings.FontFamily)
                .text(function(d: Annotation) { return d.text; });
                //.call(drag);
            
                // rewrite the way drag is called, initialize it one way and update another way

            svg.selectAll('.annotationLine')
                .data(annotations)
                .join(
                    enter => enter.append('line')
                        .classed('annotationLine', true)
                        .attr("x1", function(d: Annotation) { return x(d.date); })
                        .attr("y1", function(d: Annotation) { return y(d.value); })
                        .attr("x2", function(d: Annotation) { return d.x; })
                        .attr("y2", function(d: Annotation) { return d.y; })
                        .attr('stroke', settings.AnnotationSettings.LineColor)
                        .attr('stroke-width', settings.AnnotationSettings.LineThickness),
                    update => update.attr("x1", function(d: Annotation) { return x(d.date); })
                        .attr("y1", function(d: Annotation) { return y(d.value); })
                        .attr("x2", function(d: Annotation) { 
                            return d.x + d.text.length * (fontsize / 4.5); 
                        })
                        .attr("y2", function(d: Annotation) { 
                            return (d.y > d.graphy ? d.y - fontsize : d.y + fontsize / 2);
                        })
                );
            
            // set line type (if dashed is selected)
            if (settings.AnnotationSettings.LineStyle == 'dashed') {
                svg.selectAll('.annotationLine')
                    .attr('stroke-dasharray', '5,4');
            }
        }

        if (settings.AnnotationSettings.ToggleAnnotations){
            // update();

            svg.selectAll('.annotationText')
                .data(this.annotations)
                .join('text')
                .classed('annotationText', true)
                .attr('x', function(d) { return d.x; })
                .attr('y', function(d) { return d.y; })
                .attr('font-size', settings.AnnotationSettings.FontSize)
                .style('fill', settings.AnnotationSettings.FontColor)
                .style('font-family', settings.AnnotationSettings.FontFamily)
                .text(function(d) { return d.text; });
                
            svg.selectAll('.annotationText')
                .call(drag);

            svg.selectAll('.annotationLine')
            .data(this.annotations)
            .join(
                enter => enter.append('line')
                    .classed('annotationLine', true)
                    .attr("x1", function(d: Annotation) { return x(d.date); })
                        .attr("y1", function(d: Annotation) { return y(d.value); })
                    .attr("x2", function(d: Annotation) { 
                        return d.x + d.text.length * (settings.AnnotationSettings.FontSize / 4.5); 
                    })
                    .attr("y2", function(d: Annotation) { 
                        return (d.y > d.graphy ? d.y - settings.AnnotationSettings.FontSize : d.y + settings.AnnotationSettings.FontSize / 2);
                    })
                    .attr('stroke', settings.AnnotationSettings.LineColor)
                    .attr('stroke-width', settings.AnnotationSettings.LineThickness),
                update => update.attr("x1", function(d: Annotation) { return x(d.date); })
                    .attr("y1", function(d: Annotation) { return y(d.value); })
                    .attr("x2", function(d: Annotation) { 
                        return d.x + d.text.length * (settings.AnnotationSettings.FontSize / 4.5); 
                    })
                    .attr("y2", function(d: Annotation) { 
                        return (d.y > d.graphy ? d.y - settings.AnnotationSettings.FontSize : d.y + settings.AnnotationSettings.FontSize / 2);
                    })
            );
        
            // set line type (if dashed is selected)
            if (settings.AnnotationSettings.LineStyle == 'dashed') {
                svg.selectAll('.annotationLine')
                    .attr('stroke-dasharray', '5,4');
            }
        }

        // Update the newTextElements and newLineElements variables to include the annotations
        newTextElements = svg.selectAll('text')
            .filter(function(_, i) {
                return i >= existingTextCount;
            });

        newLineElements = svg.selectAll('line')
            .filter(function(_, i) {
                return i >= existingLineCount;
            });

    }

    private static parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
     public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
    }
}