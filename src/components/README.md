# Shared UI components

Prop-driven, Tailwind + brand tokens. Reuse these everywhere (no copy-paste).

| Component   | Key props                                                                          |
| ----------- | ---------------------------------------------------------------------------------- |
| Button      | variant (primary/secondary/gold/ghost), size (sm/md/lg), disabled                  |
| Input       | label, ...input props                                                              |
| Select      | label, children (options)                                                          |
| Badge       | tone (forest/gold/crimson/gray)                                                    |
| Card        | className, children                                                                |
| Modal       | open, onClose, title, children                                                     |
| Spinner     | className                                                                          |
| Rating      | value, count                                                                       |
| Toast       | show, children                                                                     |
| ProductCard | product ({ _id, slug, title, basePrice, images, rating, reviewCount, vendorName }) |

Visual check: run the app and open `/components-demo`.
