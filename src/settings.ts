/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

"use strict";

import { dataViewObjectsParser } from "powerbi-visuals-utils-dataviewutils";
import DataViewObjectsParser = dataViewObjectsParser.DataViewObjectsParser;

export class VisualSettings extends DataViewObjectsParser {
    public LayoutSettings: LayoutSettings = new LayoutSettings();
    public XAxisSettings: XAxisSettings = new XAxisSettings();
    public YAxisSettings: YAxisSettings = new YAxisSettings();
    public TooltipSettings: TooltipSettings = new TooltipSettings();
    public PointLabels: PointLabels = new PointLabels();
    public GrowthIndicator: GrowthIndicator = new GrowthIndicator();
    public PrimaryLabelSettings: PrimaryLabelSettings = new PrimaryLabelSettings();
    public SecondaryGrowthIndicator: SecondaryGrowthIndicator = new SecondaryGrowthIndicator();
    public SecondaryLabelSettings: SecondaryLabelSettings = new SecondaryLabelSettings();
    public AnnotationSettings: AnnotationSettings = new AnnotationSettings();
    public LineSettings: LineSettings = new LineSettings();
}

export class LayoutSettings {
    public ChartTopMargin: number = 10;
    public ChartBottomMargin: number = 30;
    public ChartLeftMargin: number = 60;
    public ChartRightMargin: number = 70;

    public AxisColor: string = '#CCCCCC';
    public ToggleGridLines: boolean = false;

}

export class LineSettings {
    public LineColor: string = '#4682B4';

    public LineThickness: number = 1.5;
}

export class XAxisSettings {
    public FontFamily: string = 'Calibri';
    public FontColor: string = '#666666';
    public FontSize: number = 10;

    public TickCount: number = 10;

    public LabelAngle: number = 0;

    public XOffset: number = 0;
    public YOffset: number = 0;
}


export class YAxisSettings {
    public MinValue: number = 0;
    public MaxValue: number = 0;

    public DisplayUnits: string = 'auto';
    public DisplayDigits: number = 1;

    public TickCount: number = 6;

    public FontFamily: string = 'Calibri';
    public FontColor: string = '#666666';
    public FontSize: number = 10;
}

export class TooltipSettings {
    public ToggleTooltip: boolean = true;

    public TooltipColour: string = '#4682b4';
    public TextColour: string = '#ffffff';

    public TextSize: number = 14;
}

export class PointLabels {
    public TogglePointLabels: boolean = false;

    public Frequency: string = 'monthly';
    public nValue: number = 1;
    public Value: string = 'max';

    public FontColor: string = '#000000';
    public FontFamily: string = 'Calibri';
    public FontSize: number = 11;

    public XOffset: number = -5;
    public YOffset: number = 10;
}

export class GrowthIndicator {
    public ToggleGrowthIndicator: boolean = true;

    public Selector1: string = '';
    public Selector2: string = '';

    public LineColor: string = '#808080';
    public LineOffsetWidth: number = 20;
    public LineSize: number = 1;

    public ShowArrowLine: boolean = true;
    
    public IncreasingColour: string = '#32CD32';
    public DecreasingColour: string = '#FF0000';

    public ShowArrow: boolean = true;
    public ArrowSize: number = 30;

}

export class PrimaryLabelSettings {
    public ShowSign: boolean = true;

    public FontColor: string = '#000000';
    public FontFamily: string = 'Calibri';
    public FontSize: number = 12;

    public LabelOffsetWidth: number = 25;

    public ToggleBgShape: boolean = false;
    public LabelBackgroundColor: string = '#ffffff';

    public BorderColor: string = '#808080';
    public BorderSize: number = 1;

    public LabelHeight: number = 10;
    public LabelMinWidth: number = 20;
}

export class SecondaryGrowthIndicator {
    public ToggleGrowthIndicator: boolean = true;

    public Selector1: string = '';
    public Selector2: string = '';

    public LineColor: string = '#808080';
    public LineOffsetHeight: number = 25;
    public LineSize: number = 1;

    public DisplayArrow: string = 'both';
    public ArrowSize: number = 40;
    public ArrowOffset: number = 10;
}

export class SecondaryLabelSettings {
    public Location: string = 'top';
    public ShowSign: boolean = true;

    public FontColor: string = '#000000';
    public FontFamily: string = 'Calibri';
    public FontSize: number = 12;

    public LabelOffsetHeight: number = 0;

    public ToggleBgShape: boolean = true;
    public LabelBackgroundColor: string = '#ffffff';

    public BorderColor: string = '#808080';
    public BorderSize: number = 1;

    public LabelHeight: number = 10;
    public LabelMinWidth: number = 20;
}

export class AnnotationSettings {
    public ToggleAnnotations: boolean = true;

    public XOffset: number = 20;
    public YOffset: number = 30;

    public FontFamily: string = 'Calibri';
    public FontColor: string = '#666666';
    public FontSize: number = 10;

    public LineColor: string = '#666666';
    public LineThickness: number = 1;
    public LineStyle: string = 'solid';

    public ShowArrow: boolean = false;
    public ArrowSize: number = 40;

    public SaveLocations: boolean = false;
}