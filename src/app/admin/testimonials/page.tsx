'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, Check, X, Eye, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { Database } from '@/lib/supabase/database.types'

type Testimonial = Database['public']['Tables']['testimonials']['Row']

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [isLoading, setIsLoading] = useState(true)

  const fetchTestimonials = useCallback(async () => {
    setIsLoading(true)
    const supabase = createClient()

    let query = supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false })

    if (filter !== 'all') {
      query = query.eq('status', filter)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching testimonials:', error)
      toast.error('Failed to load testimonials')
    } else {
      setTestimonials(data || [])
    }
    setIsLoading(false)
  }, [filter])

  useEffect(() => {
    fetchTestimonials()
  }, [fetchTestimonials])

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    const supabase = createClient()

    const { error } = await supabase
      .from('testimonials')
      .update({
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('Error updating testimonial:', error)
      toast.error('Failed to update testimonial')
    } else {
      toast.success(`Testimonial ${status}`)
      fetchTestimonials()
    }
  }

  const toggleFeatured = async (id: string, currentFeatured: boolean) => {
    const supabase = createClient()

    const { error } = await supabase
      .from('testimonials')
      .update({ is_featured: !currentFeatured })
      .eq('id', id)

    if (error) {
      console.error('Error updating featured status:', error)
      toast.error('Failed to update featured status')
    } else {
      toast.success(currentFeatured ? 'Removed from featured' : 'Added to featured')
      fetchTestimonials()
    }
  }

  const deleteTestimonial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return

    const supabase = createClient()

    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting testimonial:', error)
      toast.error('Failed to delete testimonial')
    } else {
      toast.success('Testimonial deleted')
      fetchTestimonials()
    }
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Testimonials Management</h1>
        <p className="text-muted-foreground">
          Review and manage customer testimonials
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            onClick={() => setFilter(status)}
            className={filter === status ? 'bg-[#0B5394]' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'pending' && (
              <Badge variant="secondary" className="ml-2">
                {testimonials.filter(t => t.status === 'pending').length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Testimonials List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading testimonials...</p>
        </div>
      ) : testimonials.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            No {filter !== 'all' ? filter : ''} testimonials found
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-lg">
                        {testimonial.customer_name}
                      </CardTitle>
                      <Badge
                        variant={
                          testimonial.status === 'approved'
                            ? 'default'
                            : testimonial.status === 'pending'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {testimonial.status}
                      </Badge>
                      {testimonial.is_featured && (
                        <Badge className="bg-[#F78309]">Featured</Badge>
                      )}
                    </div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < testimonial.rating
                              ? 'fill-[#F78309] text-[#F78309]'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.customer_email}
                      {testimonial.customer_location && ` • ${testimonial.customer_location}`}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {testimonial.title && (
                  <h3 className="font-semibold mb-2">{testimonial.title}</h3>
                )}
                <p className="text-muted-foreground mb-4">{testimonial.content}</p>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    <Eye className="h-4 w-4 inline mr-1" />
                    {testimonial.helpful_count} helpful votes
                    <span className="mx-2">•</span>
                    Submitted {formatDate(testimonial.created_at)}
                  </div>

                  <div className="flex gap-2">
                    {testimonial.status !== 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 hover:text-green-700"
                        onClick={() => updateStatus(testimonial.id, 'approved')}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    {testimonial.status !== 'rejected' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => updateStatus(testimonial.id, 'rejected')}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    )}
                    {testimonial.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className={testimonial.is_featured ? 'bg-[#F78309] text-white' : ''}
                        onClick={() => toggleFeatured(testimonial.id, testimonial.is_featured)}
                      >
                        {testimonial.is_featured ? 'Unfeature' : 'Feature'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteTestimonial(testimonial.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
