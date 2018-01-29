---
layout: post
title:  "Weeds & Trees (in Three.js)"
date:   2018-01-27 18:21:43 +0000
categories: jekyll update threejs biomimicry
---

Recently I have been working with the great 3D javascript library for webGL, [three.js](https://threejs.org/). After progressing through the various tutorials available I started looking for something interesting to implement using the library that wasn't just making boxes.

Humboldt-University have a great section of [Complexity Explorables](http://rocs.hu-berlin.de/explorables/explorables/) which they describe as

> A collection of interactive explorable explanations of complex systems in biology, 
> physics, mathematics, social sciences, epidemiology, ecology and other fields….

One of the examples I particularly liked was using a simple iterative method to generate trees and branching patterns using the d3 library.

<!-- [![HU's Weeds &amp; Trees explorable](/resources/Screenshot_2018-01-27_19-48-57.png)](http://rocs.hu-berlin.de/explorables/explorables/weeds-trees/ "Title") -->

{% include include_tree.html content="/resources/tree.html" %}

Obviously, this is in 2d, so I thought it would be interesting to see if this algorithym could be generalised to 3D tree generation.

Initially I did a straight port of the algorithm in the source code to three.js:

{% include include_tree.html content="/resources/explorables_weeds_trees_2.html?2d=1" %}


Obviously, that's just a flat structure, and if you rotate it 90 degrees, it gives the game away;

![HU's Weeds &amp; Trees explorable](/resources/Screenshot_2018-01-27_20-07-36.png
)

My initial attempts at rotating in 3D were not entirely successful.  Though for the "Tim Burton Tree", it's not actually far off what you would expect

![HU's Weeds &amp; Trees explorable](/resources/Screenshot_2018-01-27_20-16-43.png)





{% highlight ruby %}
def print_hi(name)
  puts "Hi, #{name}"
end
print_hi('Tom')
#=> prints 'Hi, Tom' to STDOUT.
{% endhighlight %}

#References#

http://jasser.nl/fractal/

Check out the [Jekyll docs][jekyll-docs] for more info on how to get the most out of Jekyll. File all bugs/feature requests at [Jekyll’s GitHub repo][jekyll-gh]. If you have questions, you can ask them on [Jekyll Talk][jekyll-talk].

[jekyll-docs]: http://jekyllrb.com/docs/home
[jekyll-gh]:   https://github.com/jekyll/jekyll
[jekyll-talk]: https://talk.jekyllrb.com/
