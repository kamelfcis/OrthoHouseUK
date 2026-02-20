import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const useBranchData = (branchCode = 'UK') => {
  const [branchData, setBranchData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        setLoading(true)
        
        // Fetch branch info
        const { data: branch, error: branchError } = await supabase
          .from('branches')
          .select('*')
          .eq('branch_code', branchCode)
          .eq('is_active', true)
          .single()

        if (branchError) throw branchError

        if (!branch) {
          throw new Error(`Branch ${branchCode} not found`)
        }

        // Run all branch-dependent queries in parallel for faster loading
        const [
          contentResult,
          infoResult,
          statsResult,
          productsResult,
          partnersResult,
          blogsResult
        ] = await Promise.all([
          // Fetch branch-specific page content
          supabase
            .from('branch_page_content')
            .select(`
              *,
              page_sections (*)
            `)
            .eq('branch_id', branch.branch_id)
            .eq('is_active', true)
            .eq('is_public', true),

          // Fetch company info
          supabase
            .from('company_info')
            .select('*')
            .eq('branch_id', branch.branch_id)
            .eq('is_active', true),

          // Fetch company statistics
          supabase
            .from('company_statistics')
            .select('*')
            .eq('branch_id', branch.branch_id)
            .order('stat_date', { ascending: false }),

          // Fetch products for this branch
          supabase
            .from('branch_products')
            .select(`
              *,
              products (
                *,
                product_categories (*),
                partners (*)
              )
            `)
            .eq('branch_id', branch.branch_id)
            .eq('is_available', true)
            .eq('is_public', true),

          // Fetch partners for this branch
          supabase
            .from('branch_partners')
            .select(`
              *,
              partners (*)
            `)
            .eq('branch_id', branch.branch_id)
            .eq('is_active', true),

          // Fetch blogs for this branch
          supabase
            .from('blogs')
            .select('*')
            .eq('branch_id', branch.branch_id)
            .eq('status', 'published')
            .eq('is_public', true)
            .order('published_at', { ascending: false })
            .limit(6)
        ])

        if (contentResult.error) throw contentResult.error
        if (infoResult.error) throw infoResult.error
        if (statsResult.error) throw statsResult.error
        if (productsResult.error) throw productsResult.error
        if (partnersResult.error) throw partnersResult.error
        if (blogsResult.error) throw blogsResult.error

        const pageContent = contentResult.data
        const companyInfo = infoResult.data
        const statistics = statsResult.data
        const branchProducts = productsResult.data
        const branchPartners = partnersResult.data
        const blogs = blogsResult.data

        // Organize page content by section
        const contentBySection = {}
        pageContent?.forEach(content => {
          const sectionName = content.page_sections?.section_name
          if (sectionName) {
            contentBySection[sectionName] = content
          }
        })

        // Organize company info by type
        const infoByType = {}
        companyInfo?.forEach(info => {
          infoByType[info.info_type] = info
        })

        // Organize statistics by type
        const statsByType = {}
        statistics?.forEach(stat => {
          if (!statsByType[stat.stat_type]) {
            statsByType[stat.stat_type] = []
          }
          statsByType[stat.stat_type].push(stat)
        })

        setBranchData({
          branch,
          pageContent: contentBySection,
          companyInfo: infoByType,
          statistics: statsByType,
          products: branchProducts || [],
          partners: branchPartners || [],
          blogs: blogs || []
        })
      } catch (err) {
        console.error('Error fetching branch data:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchBranchData()
  }, [branchCode])

  return { branchData, loading, error }
}

export default useBranchData

