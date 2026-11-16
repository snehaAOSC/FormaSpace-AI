import React from "react";
import {
  ExternalLink,
  Info,
  Maximize2,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  X,
} from "lucide-react";
import { getDirectRetailerUrl, getGoogleShoppingUrl } from "../lib/retailerUrls";

export interface ProductDetailData {
  product_id?: string;
  product_name: string;
  category?: string;
  brand: string;
  price?: string;
  price_num?: number;
  currency?: string;
  image_url: string;
  product_url?: string;
  description?: string;
  dimensions?: string;
  material?: string;
  color?: string;
  style?: string;
  availability?: string;
  last_verified?: string;
}

interface ProductQuickViewModalProps {
  product: ProductDetailData | null;
  onClose: () => void;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
}) => {
  if (!product) return null;

  const directRetailerUrl = getDirectRetailerUrl(product);
  const googleShoppingUrl = getGoogleShoppingUrl(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[#DCCBB5] bg-[#F7F4ED] shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#DCCBB5]/60 bg-white px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#172B3A] px-3 py-1 text-xs font-semibold text-white">
              {product.brand}
            </span>
            {product.category && (
              <span className="rounded-full bg-[#C87960]/15 px-2.5 py-0.5 text-xs font-semibold text-[#C87960]">
                {product.category}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#252B2E]/70 hover:bg-[#F7F4ED] hover:text-[#172B3A] transition"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="grid gap-6 p-6 sm:grid-cols-12 max-h-[75vh] overflow-y-auto">
          {/* Left Column: Image */}
          <div className="sm:col-span-6 space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#DCCBB5] bg-white shadow-sm">
              <img
                src={product.image_url}
                alt={product.product_name}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                Authentic Architectural Piece
              </span>
            </div>

            {/* Badges / Guarantees */}
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[#252B2E]/80">
              <div className="flex items-center gap-1.5 rounded-xl border border-[#DCCBB5]/60 bg-white p-2">
                <Truck className="h-4 w-4 text-[#C87960] shrink-0" />
                <span>{product.availability || "In Stock · Express Delivery"}</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-[#DCCBB5]/60 bg-white p-2">
                <ShieldCheck className="h-4 w-4 text-[#9BAE9A] shrink-0" />
                <span>Verified Retailer</span>
              </div>
            </div>


          </div>

          {/* Right Column: Details & Actions */}
          <div className="sm:col-span-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#C87960]">
                {product.style || "Architectural Design"}
              </div>
              <h3 className="font-editorial text-2xl font-bold text-[#172B3A] mt-1 leading-snug">
                {product.product_name}
              </h3>

              {/* Price */}
              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-editorial text-3xl font-bold text-[#172B3A]">
                  {product.price || (product.price_num ? `₹${Math.round(product.price_num).toLocaleString("en-IN")}` : "")}
                </span>
                <span className="text-xs text-[#252B2E]/60">Verified retailer price</span>
              </div>

              {/* Description */}
              {product.description && (
                <p className="mt-3 text-xs leading-relaxed text-[#252B2E]/75">
                  {product.description}
                </p>
              )}

              {/* Specifications List */}
              <div className="mt-4 space-y-1.5 rounded-2xl border border-[#DCCBB5]/60 bg-white p-3.5 text-xs text-[#172B3A]">
                {product.material && (
                  <div className="flex justify-between">
                    <span className="text-[#252B2E]/60">Material:</span>
                    <span className="font-medium text-right">{product.material}</span>
                  </div>
                )}
                {product.dimensions && (
                  <div className="flex justify-between">
                    <span className="text-[#252B2E]/60">Dimensions:</span>
                    <span className="font-medium text-right">{product.dimensions}</span>
                  </div>
                )}
                {product.color && (
                  <div className="flex justify-between">
                    <span className="text-[#252B2E]/60">Color / Finish:</span>
                    <span className="font-medium text-right">{product.color}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#252B2E]/60">Retailer Store:</span>
                  <span className="font-semibold text-[#172B3A]">{product.brand} Official</span>
                </div>
              </div>
            </div>

            {/* Direct Action Buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={directRetailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center py-3 text-xs font-semibold shadow-md flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Open Exact Product on {product.brand}</span>
                <ExternalLink className="h-3.5 w-3.5 opacity-80" />
              </a>

              <a
                href={googleShoppingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#DCCBB5] bg-white py-2 text-xs font-medium text-[#172B3A] hover:border-[#C87960] hover:text-[#C87960] transition"
              >
                <span>Find & Compare on Google Shopping</span>
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
